import React, { useState, useRef } from 'react';
import { X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useParams } from 'react-router-dom';
import { ProspectsService } from '@/services/prospectsService';

interface BulkUploadModalProps {
  onClose: () => void;
  onSuccess: (result: { total: number; added: number; skipped: number; errors: number }) => void;
}

const BulkUploadModal: React.FC<BulkUploadModalProps> = ({ onClose, onSuccess }) => {
  const { toast } = useToast();
  const { id: campaignId } = useParams<{ id: string }>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    if (!campaignId) {
      toast({
        title: "Error",
        description: "Campaign ID is missing",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const result = await ProspectsService.uploadProspects(campaignId, file);
      
      // Pass the result to the parent component
      setIsUploading(false);
      onSuccess(result);
    } catch (error) {
      console.error('Error uploading prospects:', error);
      toast({
        title: "Error",
        description: "Failed to upload prospects. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-xl p-6 relative">
        <button 
          className="absolute top-4 right-4 text-gray-400 hover:text-black" 
          onClick={onClose}
          disabled={isUploading}
        >
          <X size={20} />
        </button>

        <h2 className="text-lg font-semibold mb-4">Bulk Upload Prospects</h2>

        <p className="text-sm text-gray-600 mb-6">
          Download this{' '}
          <a 
            href="https://json-saas-tempplate.s3.us-east-1.amazonaws.com/novitium.csv"
            download="prospects-template.csv"
            className="text-purple-600 hover:text-purple-700 underline"
          >
            template.csv
          </a>
          {' '}to populate with data and upload below
        </p>
        <p className="text-xs text-gray-500 mb-4">
          The template includes columns for: Name, Email, Organization, Designation, and LinkedIn URL.
        </p>

        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer ${
            file ? 'border-purple-300 bg-purple-50' : 'border-gray-200 hover:border-purple-300'
          }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv"
            className="hidden"
          />
          
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          
          {file ? (
            <div className="mt-4">
              <p className="font-medium text-purple-600">{file.name}</p>
              <p className="text-sm text-gray-500">
                {(file.size / 1024).toFixed(2)} KB
              </p>
            </div>
          ) : (
            <div className="mt-4">
              <p className="font-medium">Click to upload or drag and drop</p>
              <p className="text-sm text-gray-500">CSV files only (max 5MB)</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isUploading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            className="bg-purple-600 hover:bg-purple-700"
            disabled={!file || isUploading}
          >
            {isUploading ? 'Uploading...' : 'Upload Prospects'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BulkUploadModal;
