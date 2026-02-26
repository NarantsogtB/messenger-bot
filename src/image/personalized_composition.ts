import { Env } from '../types';

export async function composePersonalizedPalette(
  env: Env, 
  userImageBuffer: ArrayBuffer, 
  templateUrl: string
): Promise<ArrayBuffer | null> {
  const url = `${env.PYTHON_API_URL}/compose?template_url=${encodeURIComponent(templateUrl)}`;
  
  const formData = new FormData();
  const blob = new Blob([userImageBuffer], { type: 'image/jpeg' });
  formData.append('file', blob, 'image.jpg');

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
