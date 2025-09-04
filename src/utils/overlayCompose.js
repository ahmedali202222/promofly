// Utility functions for creating overlay compositions

export const loadImgFromBlob = (blob) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(blob);
  });
};

export const makeOverlayPNG = async ({ 
  businessName = '', 
  primaryColor = '#F59E0B', 
  logoUrl = '', 
  template = 'basic',
  W = 1080, 
  H = 1920 
}) => {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  
  // Clear canvas
  ctx.clearRect(0, 0, W, H);
  
  // Create overlay based on template
  if (template === 'sale') {
    // Sale banner at top
    ctx.fillStyle = primaryColor;
    ctx.fillRect(0, 0, W, 120);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SALE!', W / 2, 60);
  } else if (template === 'new_arrival') {
    // New arrival banner
    ctx.fillStyle = '#3B82F6';
    ctx.fillRect(0, 0, W, 100);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('NEW ARRIVAL', W / 2, 50);
  } else if (template === 'limited_offer') {
    // Limited offer banner
    ctx.fillStyle = '#8B5CF6';
    ctx.fillRect(0, 0, W, 100);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('LIMITED OFFER', W / 2, 50);
  }
  
  // Add business name at bottom
  if (businessName) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, H - 80, W, 80);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(businessName, W / 2, H - 40);
  }
  
  return new Promise(resolve => {
    canvas.toBlob(resolve, 'image/png');
  });
};

export const mergePNGs = async (baseBlobA, baseBlobB, W = 1080, H = 1920) => {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  
  const imgA = await loadImgFromBlob(baseBlobA);
  const imgB = await loadImgFromBlob(baseBlobB);
  
  ctx.drawImage(imgA, 0, 0, W, H);
  ctx.drawImage(imgB, 0, 0, W, H);
  
  return new Promise(resolve => {
    canvas.toBlob(resolve, 'image/png');
  });
};
