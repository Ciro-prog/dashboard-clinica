# Abstract Storage Service for Medical Records
# Provides abstraction layer between local and MinIO storage

import os
import uuid
import shutil
from abc import ABC, abstractmethod
from typing import BinaryIO, Optional, Dict, List, Union
from datetime import datetime
from pathlib import Path
import io
import logging

from .storage import get_minio_client

logger = logging.getLogger(__name__)

class StorageProvider(ABC):
    """Abstract base class for storage providers"""
    
    @abstractmethod
    async def upload_document(
        self, 
        clinic_id: str,
        patient_id: str, 
        file_data: BinaryIO, 
        filename: str, 
        file_size: int,
        content_type: str = "application/octet-stream",
        metadata: Optional[Dict[str, str]] = None
    ) -> Dict[str, str]:
        """Upload a medical document"""
        pass
    
    @abstractmethod
    async def get_download_url(self, clinic_id: str, file_path: str) -> str:
        """Get download URL for a document"""
        pass
    
    @abstractmethod
    async def delete_document(self, clinic_id: str, file_path: str) -> bool:
        """Delete a document"""
        pass
    
    @abstractmethod
    async def list_patient_documents(self, clinic_id: str, patient_id: str) -> List[Dict[str, str]]:
        """List all documents for a patient"""
        pass

class LocalStorageProvider(StorageProvider):
    """Local filesystem storage provider (legacy)"""
    
    def __init__(self, upload_dir: str = "uploads"):
        self.upload_dir = Path(upload_dir)
        self.upload_dir.mkdir(exist_ok=True)
    
    async def upload_document(
        self, 
        clinic_id: str,
        patient_id: str, 
        file_data: BinaryIO, 
        filename: str, 
        file_size: int,
        content_type: str = "application/octet-stream",
        metadata: Optional[Dict[str, str]] = None
    ) -> Dict[str, str]:
        """Upload document to local filesystem"""
        try:
            # Create directory structure
            patient_dir = self.upload_dir / "patients" / patient_id
            patient_dir.mkdir(parents=True, exist_ok=True)
            
            # Generate unique filename
            file_extension = Path(filename).suffix
            document_id = str(uuid.uuid4())
            unique_filename = f"{document_id}{file_extension}"
            file_path = patient_dir / unique_filename
            
            # Save file
            with open(file_path, "wb") as buffer:
                content = await file_data.read() if hasattr(file_data, 'read') else file_data.read()
                buffer.write(content)
            
            return {
                "file_path": str(file_path),
                "document_id": document_id,
                "file_size": file_size,
                "upload_date": datetime.utcnow().isoformat(),
                "storage_type": "local"
            }
            
        except Exception as e:
            logger.error(f"❌ Local storage upload failed: {str(e)}")
            raise
    
    async def get_download_url(self, clinic_id: str, file_path: str) -> str:
        """Return local file path (no URL generation needed)"""
        return file_path
    
    async def delete_document(self, clinic_id: str, file_path: str) -> bool:
        """Delete file from local filesystem"""
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                return True
            return False
        except Exception as e:
            logger.error(f"❌ Local storage delete failed: {str(e)}")
            return False
    
    async def list_patient_documents(self, clinic_id: str, patient_id: str) -> List[Dict[str, str]]:
        """List documents in local filesystem"""
        try:
            patient_dir = self.upload_dir / "patients" / patient_id
            if not patient_dir.exists():
                return []
            
            documents = []
            for file_path in patient_dir.glob("*"):
                if file_path.is_file():
                    stat = file_path.stat()
                    documents.append({
                        "file_path": str(file_path),
                        "filename": file_path.name,
                        "size": stat.st_size,
                        "last_modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                        "storage_type": "local"
                    })
            
            return documents
            
        except Exception as e:
            logger.error(f"❌ Local storage list failed: {str(e)}")
            return []

class MinIOStorageProvider(StorageProvider):
    """MinIO storage provider for scalable medical document storage"""
    
    def __init__(self):
        self.client = get_minio_client()
    
    async def upload_document(
        self, 
        clinic_id: str,
        patient_id: str, 
        file_data: BinaryIO, 
        filename: str, 
        file_size: int,
        content_type: str = "application/octet-stream",
        metadata: Optional[Dict[str, str]] = None
    ) -> Dict[str, str]:
        """Upload document to MinIO"""
        try:
            result = await self.client.upload_medical_document(
                clinic_id=clinic_id,
                patient_id=patient_id,
                file_data=file_data,
                filename=filename,
                file_size=file_size,
                content_type=content_type,
                metadata=metadata
            )
            
            result["storage_type"] = "minio"
            return result
            
        except Exception as e:
            logger.error(f"❌ MinIO storage upload failed: {str(e)}")
            raise
    
    async def get_download_url(self, clinic_id: str, object_name: str) -> str:
        """Get presigned download URL from MinIO"""
        try:
            return await self.client.get_presigned_download_url(clinic_id, object_name)
        except Exception as e:
            logger.error(f"❌ MinIO download URL generation failed: {str(e)}")
            raise
    
    async def delete_document(self, clinic_id: str, object_name: str) -> bool:
        """Delete document from MinIO"""
        try:
            return await self.client.delete_medical_document(clinic_id, object_name)
        except Exception as e:
            logger.error(f"❌ MinIO storage delete failed: {str(e)}")
            return False
    
    async def list_patient_documents(self, clinic_id: str, patient_id: str) -> List[Dict[str, str]]:
        """List patient documents from MinIO"""
        try:
            documents = await self.client.list_patient_documents(clinic_id, patient_id)
            for doc in documents:
                doc["storage_type"] = "minio"
            return documents
        except Exception as e:
            logger.error(f"❌ MinIO storage list failed: {str(e)}")
            return []

class MedicalDocumentStorageService:
    """
    Unified storage service for medical documents.
    Handles both local and MinIO storage with seamless switching.
    """
    
    def __init__(self, use_minio: bool = True):
        """
        Initialize storage service
        
        Args:
            use_minio: If True, use MinIO storage; if False, use local storage
        """
        self.use_minio = use_minio
        
        if use_minio:
            self.provider = MinIOStorageProvider()
            logger.info("🔧 Initialized MinIO storage provider")
        else:
            self.provider = LocalStorageProvider()
            logger.info("🔧 Initialized local storage provider")
    
    async def upload_medical_document(
        self,
        clinic_id: str,
        patient_id: str,
        file_data: BinaryIO,
        filename: str,
        file_size: int,
        document_type: str = "medical_record",
        description: Optional[str] = None,
        content_type: str = "application/octet-stream"
    ) -> Dict[str, str]:
        """
        Upload medical document with metadata
        
        Args:
            clinic_id: Clinic identifier
            patient_id: Patient identifier
            file_data: File binary data
            filename: Original filename
            file_size: File size in bytes
            document_type: Type of medical document
            description: Document description
            content_type: MIME type
            
        Returns:
            Upload result with storage information
        """
        try:
            # Prepare metadata
            metadata = {
                "document-type": document_type,
                "description": description or f"Medical document: {filename}",
                "clinic-id": clinic_id,
                "patient-id": patient_id
            }
            
            result = await self.provider.upload_document(
                clinic_id=clinic_id,
                patient_id=patient_id,
                file_data=file_data,
                filename=filename,
                file_size=file_size,
                content_type=content_type,
                metadata=metadata
            )
            
            logger.info(f"✅ Uploaded medical document: {filename} for patient {patient_id}")
            return result
            
        except Exception as e:
            logger.error(f"❌ Medical document upload failed: {str(e)}")
            raise
    
    async def get_document_download_url(self, clinic_id: str, file_path: str) -> str:
        """Get secure download URL for medical document"""
        try:
            return await self.provider.get_download_url(clinic_id, file_path)
        except Exception as e:
            logger.error(f"❌ Failed to get download URL: {str(e)}")
            raise
    
    async def delete_medical_document(self, clinic_id: str, file_path: str) -> bool:
        """Delete medical document"""
        try:
            success = await self.provider.delete_document(clinic_id, file_path)
            if success:
                logger.info(f"✅ Deleted medical document: {file_path}")
            else:
                logger.warning(f"⚠️ Failed to delete medical document: {file_path}")
            return success
        except Exception as e:
            logger.error(f"❌ Delete medical document failed: {str(e)}")
            return False
    
    async def list_patient_medical_documents(self, clinic_id: str, patient_id: str) -> List[Dict[str, str]]:
        """List all medical documents for a patient"""
        try:
            documents = await self.provider.list_patient_documents(clinic_id, patient_id)
            logger.info(f"📋 Listed {len(documents)} medical documents for patient {patient_id}")
            return documents
        except Exception as e:
            logger.error(f"❌ Failed to list patient documents: {str(e)}")
            return []
    
    async def get_clinic_storage_statistics(self, clinic_id: str) -> Dict[str, any]:
        """Get storage statistics for a clinic"""
        try:
            if self.use_minio:
                return await self.provider.client.get_clinic_storage_stats(clinic_id)
            else:
                # Calculate local storage stats
                upload_dir = Path("uploads")
                clinic_dir = upload_dir / "patients"
                
                if not clinic_dir.exists():
                    return {"total_objects": 0, "total_size": 0, "patients_with_documents": 0}
                
                total_size = 0
                total_objects = 0
                patients = set()
                
                for file_path in clinic_dir.rglob("*"):
                    if file_path.is_file():
                        total_objects += 1
                        total_size += file_path.stat().st_size
                        patients.add(file_path.parent.name)
                
                return {
                    "total_objects": total_objects,
                    "total_size": total_size,
                    "total_size_mb": round(total_size / (1024 * 1024), 2),
                    "patients_with_documents": len(patients),
                    "storage_type": "local"
                }
                
        except Exception as e:
            logger.error(f"❌ Failed to get storage statistics: {str(e)}")
            return {"error": str(e)}
    
    def get_storage_type(self) -> str:
        """Get current storage type"""
        return "minio" if self.use_minio else "local"

# Global storage service instance
_storage_service = None

def get_storage_service(use_minio: bool = True) -> MedicalDocumentStorageService:
    """Get singleton storage service instance"""
    global _storage_service
    if _storage_service is None:
        _storage_service = MedicalDocumentStorageService(use_minio=use_minio)
    return _storage_service

# Configuration function for easy switching
def configure_storage(use_minio: bool = True) -> MedicalDocumentStorageService:
    """Configure and return storage service"""
    global _storage_service
    _storage_service = MedicalDocumentStorageService(use_minio=use_minio)
    return _storage_service