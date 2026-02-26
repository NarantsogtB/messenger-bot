import { Env } from '../types';

export async function composePersonalizedPalette(
  env: Env, 
  userImageBuffer: ArrayBuffer, 
  templateBuffer: ArrayBuffer
): Promise<ArrayBuffer | null> {
  const url = `${env.PYTHON_API_URL}/compose`;
  
  const formData = new FormData();
  const faceBlob = new Blob([userImageBuffer], { type: 'image/jpeg' });
  formData.append('file', faceBlob, 'user.jpg');
  
  const templateBlob = new Blob([templateBuffer], { type: 'image/png' });
  formData.append('template', templateBlob, 'template.png');

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      console.error('Composition API error:', response.status, await response.text());
      return null;
    }

    return await response.arrayBuffer();
  } catch (error) {
    console.error('Failed to call Composition API:', error);
    return null;
  }
}
