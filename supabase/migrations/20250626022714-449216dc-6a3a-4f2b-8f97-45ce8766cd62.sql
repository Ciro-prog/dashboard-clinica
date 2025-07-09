-- Crear tabla para almacenar códigos QR de WhatsApp
CREATE TABLE public.whatsapp_qr (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  qr_image_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'offline')),
  phone_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar Row Level Security
ALTER TABLE public.whatsapp_qr ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para que cada usuario solo vea sus propios códigos QR
CREATE POLICY "Users can view their own QR codes" 
  ON public.whatsapp_qr 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own QR codes" 
  ON public.whatsapp_qr 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own QR codes" 
  ON public.whatsapp_qr 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own QR codes" 
  ON public.whatsapp_qr 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Crear bucket de almacenamiento para las imágenes QR
INSERT INTO storage.buckets (id, name, public) 
VALUES ('qr-codes', 'qr-codes', true);

-- Política para el bucket de QR codes
CREATE POLICY "Anyone can view QR images" ON storage.objects
  FOR SELECT USING (bucket_id = 'qr-codes');

CREATE POLICY "Users can upload QR images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'qr-codes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their QR images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'qr-codes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their QR images" ON storage.objects
  FOR DELETE USING (bucket_id = 'qr-codes' AND auth.uid()::text = (storage.foldername(name))[1]);
