import { Env } from '../types';

export interface PythonAnalysisResult {
  skin: string;
  eyes: string;
  hair: string;
  contrast: 'High' | 'Medium' | 'Low';
  season: string;
}

export async function analyzeWithPythonAPI(env: Env, imageBuffer: ArrayBuffer): Promise<PythonAnalysisResult | null> {
  const url = `${env.PYTHON_API_URL}/analyze`;
  
  const formData = new FormData();
  // Worker environment supports FormData and Blob
  const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
  formData.append('file', blob, 'image.jpg');

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      console.error('Python API error:', response.status, await response.text());
      return null;
    }

    const data = await response.json() as any;
    
    // Mapping from Python API response to our interface
    // Based on user request: (Skin, Eyes, Hair, Contrast)
    return {
      skin: data.skin || '',
      eyes: data.eyes || '',
      hair: data.hair || '',
      contrast: data.contrast || 'Medium',
      season: data.season || 'Unknown'
    };
  } catch (error) {
    console.error('Failed to call Python API:', error);
    return null;
  }
}
