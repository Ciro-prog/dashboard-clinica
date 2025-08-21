# MinIO Storage Client for Medical Records System
import os
import uuid
from typing import BinaryIO, Optional, List, Dict
from datetime import datetime, timedelta
from minio import Minio
from minio.error import S3Error, InvalidResponseError
from minio.commonconfig import REPLACE, CopySource
import io
import logging

# Configure logging
logger = logging.getLogger(__name__)

class MinIOStorageClient:
    """
    MinIO client for medical document storage with clinic isolation.
    
    Infrastructure:
    - Host: pampaservers.com:60522 (API)
    - Web: pampaservers.com:60523 (Console)
    - Credentials: pampa / servermuA!
    - Container: b186d12be0c8
    """
    
    def __init__(self):
        """Initialize MinIO client with production credentials"""
        try:
            self.client = Minio(
                "pampaservers.com:60522",
                access_key="pampa",
                secret_key="servermuA!",
                secure=False  # Using HTTP for internal network
            )
            
            # Test connection
            if self._test_connection():
                logger.info("✅ MinIO connection established successfully")
            else:
                logger.error("❌ MinIO connection test failed")
                
        except Exception as e:
            logger.error(f"❌ Failed to initialize MinIO client: {str(e)}")
            raise
    
    def _test_connection(self) -> bool:
        """Test MinIO connection by listing buckets"""
        try:
            self.client.list_buckets()
            return True
        except Exception as e:
            logger.error(f"MinIO connection test failed: {str(e)}")
            return False
    
    def _get_bucket_name(self, clinic_id: str) -> str:
        """Generate bucket name for clinic with safe naming"""
        # Ensure bucket name is DNS-compliant
        safe_clinic_id = clinic_id.lower().replace('_', '-').replace(' ', '-')
        return f"clinic-{safe_clinic_id}"
    
    def _ensure_bucket_exists(self, bucket_name: str) -> bool:
        """Create bucket if it doesn't exist"""
        try:
            if not self.client.bucket_exists(bucket_name):
                self.client.make_bucket(bucket_name)
                logger.info(f"✅ Created bucket: {bucket_name}")
            return True
        except S3Error as e:
            logger.error(f"❌ Failed to create bucket {bucket_name}: {str(e)}")
            return False
    
    def _generate_object_name(self, patient_id: str, filename: str, document_id: Optional[str] = None) -> str:
        """Generate object name with clinic/patient structure"""
        if not document_id:
            document_id = str(uuid.uuid4())
        
        # Extract file extension
        _, ext = os.path.splitext(filename)
        
        # Create structured path: patients/{patient_id}/documents/{document_id}_{filename}
        return f"patients/{patient_id}/documents/{document_id}_{filename}"
    
    async def upload_medical_document(
        self, 
        clinic_id: str,
        patient_id: str, 
        file_data: BinaryIO, 
        filename: str, 
        file_size: int,
        content_type: str = "application/octet-stream",
        metadata: Optional[Dict[str, str]] = None
    ) -> Dict[str, str]:
        """
        Upload medical document to MinIO
        
        Args:
            clinic_id: Clinic identifier
            patient_id: Patient identifier
            file_data: File binary data
            filename: Original filename
            file_size: File size in bytes
            content_type: MIME type
            metadata: Additional metadata
            
        Returns:
            Dict with upload information
        """
        try:
            bucket_name = self._get_bucket_name(clinic_id)
            
            # Ensure bucket exists
            if not self._ensure_bucket_exists(bucket_name):
                raise Exception(f"Could not create/access bucket: {bucket_name}")
            
            # Generate unique object name
            document_id = str(uuid.uuid4())
            object_name = self._generate_object_name(patient_id, filename, document_id)
            
            # Prepare metadata
            upload_metadata = {
                "clinic-id": clinic_id,
                "patient-id": patient_id,
                "original-filename": filename,
                "upload-date": datetime.utcnow().isoformat(),
                "document-id": document_id
            }
            
            if metadata:
                upload_metadata.update(metadata)
            
            # Upload file
            result = self.client.put_object(
                bucket_name=bucket_name,
                object_name=object_name,
                data=file_data,
                length=file_size,
                content_type=content_type,
                metadata=upload_metadata
            )
            
            logger.info(f"✅ Uploaded document: {bucket_name}/{object_name}")
            
            return {
                "bucket_name": bucket_name,
                "object_name": object_name,
                "document_id": document_id,
                "file_size": file_size,
                "etag": result.etag,
                "upload_date": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to upload document: {str(e)}")
            raise
    
    async def get_presigned_download_url(
        self, 
        clinic_id: str, 
        object_name: str, 
        expires: timedelta = timedelta(hours=1)
    ) -> str:
        """
        Generate secure download URL for medical document
        
        Args:
            clinic_id: Clinic identifier
            object_name: Object path in MinIO
            expires: URL expiration time
            
        Returns:
            Presigned URL for download
        """
        try:
            bucket_name = self._get_bucket_name(clinic_id)
            
            url = self.client.presigned_get_object(
                bucket_name=bucket_name,
                object_name=object_name,
                expires=expires
            )
            
            logger.info(f"Generated download URL for: {bucket_name}/{object_name}")
            return url
            
        except Exception as e:
            logger.error(f"❌ Failed to generate download URL: {str(e)}")
            raise
    
    async def delete_medical_document(self, clinic_id: str, object_name: str) -> bool:
        """
        Delete medical document from MinIO
        
        Args:
            clinic_id: Clinic identifier
            object_name: Object path in MinIO
            
        Returns:
            Success status
        """
        try:
            bucket_name = self._get_bucket_name(clinic_id)
            
            self.client.remove_object(bucket_name, object_name)
            logger.info(f"✅ Deleted document: {bucket_name}/{object_name}")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to delete document: {str(e)}")
            return False
    
    async def list_patient_documents(
        self, 
        clinic_id: str, 
        patient_id: str
    ) -> List[Dict[str, str]]:
        """
        List all documents for a patient
        
        Args:
            clinic_id: Clinic identifier
            patient_id: Patient identifier
            
        Returns:
            List of document information
        """
        try:
            bucket_name = self._get_bucket_name(clinic_id)
            prefix = f"patients/{patient_id}/documents/"
            
            documents = []
            objects = self.client.list_objects(bucket_name, prefix=prefix, recursive=True)
            
            for obj in objects:
                # Get object metadata
                try:
                    stat = self.client.stat_object(bucket_name, obj.object_name)
                    metadata = stat.metadata or {}
                    
                    documents.append({
                        "object_name": obj.object_name,
                        "size": obj.size,
                        "last_modified": obj.last_modified.isoformat() if obj.last_modified else None,
                        "etag": obj.etag,
                        "document_id": metadata.get("document-id", ""),
                        "original_filename": metadata.get("original-filename", ""),
                        "upload_date": metadata.get("upload-date", "")
                    })
                except Exception as e:
                    logger.warning(f"Could not get metadata for {obj.object_name}: {str(e)}")
                    continue
            
            logger.info(f"📋 Listed {len(documents)} documents for patient {patient_id}")
            return documents
            
        except Exception as e:
            logger.error(f"❌ Failed to list patient documents: {str(e)}")
            return []
    
    async def get_clinic_storage_stats(self, clinic_id: str) -> Dict[str, any]:
        """
        Get storage statistics for a clinic
        
        Args:
            clinic_id: Clinic identifier
            
        Returns:
            Storage statistics
        """
        try:
            bucket_name = self._get_bucket_name(clinic_id)
            
            if not self.client.bucket_exists(bucket_name):
                return {
                    "total_objects": 0,
                    "total_size": 0,
                    "patients_with_documents": 0
                }
            
            total_size = 0
            total_objects = 0
            patients = set()
            
            objects = self.client.list_objects(bucket_name, recursive=True)
            
            for obj in objects:
                total_objects += 1
                total_size += obj.size
                
                # Extract patient_id from object path
                if obj.object_name.startswith("patients/"):
                    parts = obj.object_name.split("/")
                    if len(parts) >= 2:
                        patients.add(parts[1])
            
            return {
                "total_objects": total_objects,
                "total_size": total_size,
                "total_size_mb": round(total_size / (1024 * 1024), 2),
                "patients_with_documents": len(patients),
                "bucket_name": bucket_name
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to get storage stats: {str(e)}")
            return {
                "total_objects": 0,
                "total_size": 0,
                "patients_with_documents": 0,
                "error": str(e)
            }

# Singleton instance
_minio_client = None

def get_minio_client() -> MinIOStorageClient:
    """Get singleton MinIO client instance"""
    global _minio_client
    if _minio_client is None:
        _minio_client = MinIOStorageClient()
    return _minio_client

# Compatibility functions for existing document endpoints
async def upload_file_to_minio(
    clinic_id: str,
    patient_id: str,
    file_data: BinaryIO,
    filename: str,
    file_size: int,
    content_type: str = "application/octet-stream"
) -> Dict[str, str]:
    """Convenience function for file upload"""
    client = get_minio_client()
    return await client.upload_medical_document(
        clinic_id, patient_id, file_data, filename, file_size, content_type
    )

async def get_download_url(clinic_id: str, object_name: str) -> str:
    """Convenience function for download URL generation"""
    client = get_minio_client()
    return await client.get_presigned_download_url(clinic_id, object_name)

async def delete_file_from_minio(clinic_id: str, object_name: str) -> bool:
    """Convenience function for file deletion"""
    client = get_minio_client()
    return await client.delete_medical_document(clinic_id, object_name)