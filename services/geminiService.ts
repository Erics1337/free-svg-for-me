/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

/**
 * Generates an SVG string based on the user's prompt.
 * Calls the secure server-side API route.
 */
export const generateSvgFromPrompt = async (prompt: string, model: string): Promise<string> => {
  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, model }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to generate SVG");
    }

    return data.svg;

  } catch (error: any) {
    console.error("Generation Error:", error);
    throw new Error(error.message || "Failed to generate SVG.");
  }
};

