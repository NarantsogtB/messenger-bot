export interface Face {
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  landmarks?: any[];
}

export async function detectFace(buffer: ArrayBuffer, apiKey: string): Promise<Face | null> {
  // Convert ArrayBuffer to Base64
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64Image = btoa(binary);

  const url = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;
  const requestBody = {
    requests: [
      {
        image: {
          content: base64Image
        },
        features: [
          {
            type: "FACE_DETECTION",
            maxResults: 1
          }
        ]
      }
    ]
  };

  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(requestBody),
    headers: { 'Content-Type': 'application/json' }
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Vision API error:', errorText);
    throw new Error('Google Vision API call failed');
  }

  const data: any = await response.json();
  const annotations = data.responses[0]?.faceAnnotations;

  if (!annotations || annotations.length === 0) {
    return null;
  }

  const faceData = annotations[0];
  const vertices = faceData.boundingPoly.vertices;
  
  // Calculate bounding box from vertices
  const xs = vertices.map((v: any) => v.x || 0);
  const ys = vertices.map((v: any) => v.y || 0);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  const width = Math.max(...xs) - x;
  const height = Math.max(...ys) - y;

  return {
    boundingBox: { x, y, width, height },
    landmarks: faceData.landmarks
  };
}
