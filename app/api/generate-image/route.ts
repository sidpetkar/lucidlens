import { NextRequest, NextResponse } from 'next/server';
import { client } from "@gradio/client";

const SPACE_URL = "ByteDance/DreamO";
const HF_TOKEN_FROM_ENV = process.env.HF_TOKEN;

// Ensure the token is correctly typed for the client
const hfTokenForClient: `hf_${string}` | undefined = 
  HF_TOKEN_FROM_ENV && HF_TOKEN_FROM_ENV.startsWith('hf_') 
    ? HF_TOKEN_FROM_ENV as `hf_${string}` 
    : undefined;

if (HF_TOKEN_FROM_ENV && !hfTokenForClient) {
  console.warn("Warning: HF_TOKEN environment variable was provided but does not start with 'hf_'. It will not be used.");
} else if (!HF_TOKEN_FROM_ENV) {
  console.warn("WARNING: No HF_TOKEN environment variable found. This is required to use Hugging Face models.");
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    // Extract reference images
    const refImage1 = formData.get('refImage1') as File | null;
    const refImage2 = formData.get('refImage2') as File | null;
    
    // Extract text and numeric parameters
    const promptText = formData.get('prompt') as string | null;
    const seed = formData.get('seed') as string | null; // In DreamO, seed is a string, not a number
    const negPrompt = formData.get('negPrompt') as string | null;
    
    // Extract numeric parameters
    const width = parseInt(formData.get('width') as string || "768", 10);
    const height = parseInt(formData.get('height') as string || "768", 10);
    const refRes = parseInt(formData.get('refRes') as string || "512", 10);
    const numSteps = parseInt(formData.get('numSteps') as string || "8", 10);
    const guidance = parseFloat(formData.get('guidance') as string || "1");
    const trueCfg = parseFloat(formData.get('trueCfg') as string || "1");
    const cfgStartStep = parseInt(formData.get('cfgStartStep') as string || "0", 10);
    const cfgEndStep = parseInt(formData.get('cfgEndStep') as string || "0", 10);
    const negGuidance = parseFloat(formData.get('negGuidance') as string || "1");
    const firstStepGuidance = parseFloat(formData.get('firstStepGuidance') as string || "0");
    
    // Default tasks for reference images
    const refTask1 = formData.get('refTask1') as string || "ip";
    const refTask2 = formData.get('refTask2') as string || "ip";

    // Validation
    if (!refImage1) {
      return NextResponse.json({ error: 'Reference Image 1 is required' }, { status: 400 });
    }
    if (!promptText) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    if (!hfTokenForClient) {
      console.error("API Route: Missing or invalid Hugging Face token. Add HF_TOKEN=hf_your_token to .env.local");
      return NextResponse.json({ error: 'Missing or invalid Hugging Face token. Please add HF_TOKEN to .env.local file.' }, { status: 500 });
    }

    console.log("API Route: Using Hugging Face Token:", hfTokenForClient ? "Yes (Correctly Formatted)" : (HF_TOKEN_FROM_ENV ? "Provided but Invalid Format" : "No"));

    const app = await client(SPACE_URL, { hf_token: hfTokenForClient });

    // DreamO API parameters
    const payload: any = {
      ref_image1: refImage1,
      ref_task1: refTask1,
      prompt: promptText,
      seed: seed || "-1", // Default to -1 for random seed if not provided
      width: width,
      height: height,
      ref_res: refRes,
      num_steps: numSteps,
      guidance: guidance,
      true_cfg: trueCfg,
      cfg_start_step: cfgStartStep,
      cfg_end_step: cfgEndStep,
      neg_prompt: negPrompt || "",
      neg_guidance: negGuidance,
      first_step_guidance: firstStepGuidance
    };

    if (refImage2) {
      payload.ref_image2 = refImage2;
      payload.ref_task2 = refTask2;
    } else {
      // API requires ref_image2. Duplicate refImage1 and its task.
      payload.ref_image2 = refImage1; // Use refImage1 data for ref_image2
      payload.ref_task2 = refTask1;  // Use refTask1 for ref_task2
    }

    console.log("API Route: Sending payload to ByteDance/DreamO /generate_image endpoint:", {
      ...payload,
      ref_image1: `${refImage1?.name || "None"} (${refImage1?.size || 0} bytes)`,
      ref_image2: refImage2 ? `${refImage2?.name || "None"} (${refImage2?.size || 0} bytes)` : "Not provided",
    });

    const result: any = await app.predict("/generate_image", payload);

    console.log("API Route: DreamO API Result type:", typeof result);
    console.log("API Route: DreamO API Result keys:", Object.keys(result));
    console.log("API Route: DreamO API Result.data type:", result.data ? typeof result.data : "undefined");
    
    if (result.data) {
      console.log("API Route: DreamO API Result.data is array:", Array.isArray(result.data));
      if (Array.isArray(result.data)) {
        console.log("API Route: DreamO API Result.data length:", result.data.length);
        console.log("API Route: DreamO API Result.data elements types:", 
          result.data.map((item: any, idx: number) => `[${idx}]: ${typeof item}`).join(", "));
      }
    }

    // Process the result - DreamO returns [generatedImage, preprocessingOutputs, usedSeed]
    let imageUrl: string | null = null;
    let usedSeed: string | null = null;

    if (result && result.data && Array.isArray(result.data)) {
      // First element [0] is the generated image, which is an object containing a URL
      if (result.data[0] && typeof result.data[0] === 'object' && result.data[0].url && typeof result.data[0].url === 'string') {
        imageUrl = result.data[0].url; 
      }
      
      // Third element [2] is the used seed
      if (result.data[2] && typeof result.data[2] === 'string') {
        usedSeed = result.data[2];
        console.log("API Route: Used seed:", usedSeed);
      }
    }

    if (imageUrl) {
      console.log("API Route: Extracted imageUrl:", imageUrl);
      return NextResponse.json({ 
        imageUrl,
        usedSeed 
      });
    } else {
      console.error("API Route: Unexpected result structure or could not extract URL from /generate_image. Full data:", JSON.stringify(result, null, 2));
      return NextResponse.json({ error: 'Failed to process image: Could not extract image URL from API response.' }, { status: 500 });
    }

  } catch (err: any) {
    console.error("API Route: Call to /generate_image failed:", err.toString());
    if (err.cause) {
        console.error("Underlying cause:", err.cause);
    }
    console.error("Full error object:", JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
    return NextResponse.json({ error: err.message || 'An unexpected error occurred calling ByteDance/DreamO.' }, { status: 500 });
  }
} 