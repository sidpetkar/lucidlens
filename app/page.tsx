"use client";

import { useState, ChangeEvent, useEffect } from 'react';
// import { client } from "@gradio/client"; // No longer needed here
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from 'next/image';

// const SPACE_URL = "RiverZ/ICEdit"; // No longer needed here

export default function Home() {
  // Reference images
  const [refImage1, setRefImage1] = useState<File | null>(null);
  const [refImage1Preview, setRefImage1Preview] = useState<string | null>(null);
  const [refTask1, setRefTask1] = useState<string>("ip");

  const [refImage2, setRefImage2] = useState<File | null>(null);
  const [refImage2Preview, setRefImage2Preview] = useState<string | null>(null);
  const [refTask2, setRefTask2] = useState<string>("ip");

  // Text inputs
  const [promptText, setPromptText] = useState<string>("a person playing guitar in the street");
  const [negPromptText, setNegPromptText] = useState<string>("");
  const [seed, setSeed] = useState<string>("-1"); // -1 for random in DreamO

  // Numeric parameters with appropriate defaults from DreamO API
  const [width, setWidth] = useState<number>(768);
  const [height, setHeight] = useState<number>(768);
  const [refRes, setRefRes] = useState<number>(512);
  const [numSteps, setNumSteps] = useState<number>(12);
  const [guidance, setGuidance] = useState<number>(3.5);
  const [trueCfg, setTrueCfg] = useState<number>(1);
  const [cfgStartStep, setCfgStartStep] = useState<number>(0);
  const [cfgEndStep, setCfgEndStep] = useState<number>(0);
  const [negGuidance, setNegGuidance] = useState<number>(3.5);
  const [firstStepGuidance, setFirstStepGuidance] = useState<number>(0);
  
  // UI states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [usedSeed, setUsedSeed] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progressValue, setProgressValue] = useState<number | undefined>(undefined);

  // Show/hide advanced settings
  const [showAdvancedSettings, setShowAdvancedSettings] = useState<boolean>(false);

  // Handle reference image 1 upload
  const handleRefImage1Change = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setRefImage1(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setRefImage1Preview(reader.result as string);
      };
      reader.readAsDataURL(file);
      clearResults();
    }
  };

  // Handle reference image 2 upload
  const handleRefImage2Change = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setRefImage2(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setRefImage2Preview(reader.result as string);
      };
      reader.readAsDataURL(file);
      clearResults();
    }
  };

  // Clear error and results when inputs change
  const clearResults = () => {
    setError(null);
    setResultImage(null);
    setUsedSeed(null);
  };
  
  const handleSubmit = async () => {
    // Validate required inputs
    if (!refImage1) {
      setError("Please upload Reference Image 1");
      return;
    }
    if (!promptText.trim()) {
      setError("Please enter a prompt");
      return;
    }

    setIsLoading(true);
    clearResults();
    setProgressValue(undefined); // Reset to indeterminate for loading animation

    const formData = new FormData();
    formData.append('refImage1', refImage1);
    if (refImage2) {
      formData.append('refImage2', refImage2);
      formData.append('refTask2', refTask2);
    }
    formData.append('refTask1', refTask1);
    formData.append('prompt', promptText);
    formData.append('negPrompt', negPromptText);
    formData.append('seed', seed);
    formData.append('width', width.toString());
    formData.append('height', height.toString());
    formData.append('refRes', refRes.toString());
    formData.append('numSteps', numSteps.toString());
    formData.append('guidance', guidance.toString());
    formData.append('trueCfg', trueCfg.toString());
    formData.append('cfgStartStep', cfgStartStep.toString());
    formData.append('cfgEndStep', cfgEndStep.toString());
    formData.append('negGuidance', negGuidance.toString());
    formData.append('firstStepGuidance', firstStepGuidance.toString());

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `API request failed with status ${response.status}`);
      }

      if (data.imageUrl) {
        setResultImage(data.imageUrl);
        // If the API returns the used seed, display it
        if (data.usedSeed) {
          setUsedSeed(data.usedSeed);
        }
      } else {
        throw new Error("Invalid response structure from API.");
      }

    } catch (err: any) {
      console.error("Submit failed:", err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
      setProgressValue(100); // To hide indeterminate or show completion if it were determinate
    }
  };

  const taskOptions = [
    { value: "ip", label: "Image Prompt (ip)" },
    { value: "cr", label: "Crop (cr)" },
    { value: "bg", label: "Background (bg)" }
  ];

  // UI Rendering (remains the same)
  return (
    <div className="container mx-auto min-h-screen p-4 flex flex-col items-center">
      <header className="w-full flex justify-between items-center py-4 border-b mb-8">
        <h1 className="text-2xl font-bold">AI Image Generator (DreamO)</h1>
        <ThemeToggle />
      </header>

      <main className="w-full max-w-4xl flex flex-col gap-8">
        {/* Reference Images Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Reference Image 1 */}
          <section className="flex flex-col gap-4 p-6 border rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold">Reference Image 1</h2>
            <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg hover:border-primary transition-colors cursor-pointer" 
                 onClick={() => document.getElementById('refImage1')?.click()}>
              {refImage1Preview ? (
                <Image src={refImage1Preview} alt="Reference image 1" width={150} height={150} className="rounded-md mb-4 object-contain max-h-36" />
              ) : (
                <div className="w-32 h-32 bg-muted rounded-md flex items-center justify-center text-muted-foreground mb-4">
                  <span className="text-xs text-center px-2">Click to Upload</span>
                </div>
              )}
              <Input id="refImage1" type="file" className="hidden" onChange={handleRefImage1Change} accept="image/png, image/jpeg, image/gif"/>
            </div>
            <div>
              <Label htmlFor="refTask1" className="mb-2 block">Task for Ref Image 1</Label>
              <Select value={refTask1} onValueChange={setRefTask1}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {taskOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </section>

          {/* Reference Image 2 */}
          <section className="flex flex-col gap-4 p-6 border rounded-lg shadow-sm">
            <h2 className="text-lg font-semibold">Reference Image 2</h2>
            <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg hover:border-primary transition-colors cursor-pointer" 
                 onClick={() => document.getElementById('refImage2')?.click()}>
              {refImage2Preview ? (
                <Image src={refImage2Preview} alt="Reference image 2" width={150} height={150} className="rounded-md mb-4 object-contain max-h-36" />
              ) : (
                <div className="w-32 h-32 bg-muted rounded-md flex items-center justify-center text-muted-foreground mb-4">
                  <span className="text-xs text-center px-2">Click to Upload</span>
                </div>
              )}
              <Input id="refImage2" type="file" className="hidden" onChange={handleRefImage2Change} accept="image/png, image/jpeg, image/gif"/>
            </div>
            <div>
              <Label htmlFor="refTask2" className="mb-2 block">Task for Ref Image 2</Label>
              <Select value={refTask2} onValueChange={setRefTask2}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {taskOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </section>
        </div>

        {/* Prompt Section */}
        <section className="flex flex-col gap-4 p-6 border rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold">Prompt</h2>
          <Textarea 
            placeholder="e.g., a person playing guitar in the street" 
            rows={2} 
            value={promptText}
            onChange={(e) => {
              setPromptText(e.target.value);
              clearResults();
            }}
          />

          <div className="flex items-center mt-2">
            <Label htmlFor="seed" className="w-24">Seed:</Label>
            <Input 
              id="seed" 
              type="text"
              placeholder="-1 for random" 
              value={seed}
              onChange={(e) => {
                setSeed(e.target.value);
                clearResults();
              }}
              className="max-w-xs"
            />
          </div>
        </section>

        {/* Basic Settings */}
        <section className="flex flex-col gap-6 p-6 border rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold">Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
            <div className="flex flex-col gap-2">
              <Label htmlFor="width">Width: {width}</Label>
              <Slider 
                id="width" 
                value={[width]} 
                onValueChange={(value) => {
                  setWidth(value[0]);
                  clearResults();
                }} 
                min={384} max={1024} step={8}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="height">Height: {height}</Label>
              <Slider 
                id="height" 
                value={[height]} 
                onValueChange={(value) => {
                  setHeight(value[0]);
                  clearResults();
                }}
                min={384} max={1024} step={8}
              />
            </div>
            
            <div className="flex flex-col gap-2">
              <Label htmlFor="numSteps">Number of Steps: {numSteps}</Label>
              <Slider 
                id="numSteps" 
                value={[numSteps]} 
                onValueChange={(value) => {
                  setNumSteps(value[0]);
                  clearResults();
                }}
                min={1} max={50} step={1}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="guidance">Guidance: {guidance}</Label>
              <Slider 
                id="guidance" 
                value={[guidance]} 
                onValueChange={(value) => {
                  setGuidance(value[0]);
                  clearResults();
                }}
                min={0} max={10} step={0.1}
              />
            </div>
          </div>

          {/* Advanced Settings Toggle */}
          <Button 
            variant="outline" 
            onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
            className="w-full mt-4"
          >
            {showAdvancedSettings ? "Hide Advanced Settings" : "Show Advanced Settings"}
          </Button>
          
          {/* Advanced Settings */}
          {showAdvancedSettings && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8 border-t pt-6">
              <div className="flex flex-col gap-2">
                <Label htmlFor="refRes">Resolution for Ref Images: {refRes}</Label>
                <Slider 
                  id="refRes" 
                  value={[refRes]} 
                  onValueChange={(value) => {
                    setRefRes(value[0]);
                    clearResults();
                  }}
                  min={256} max={1024} step={8}
                />
              </div>
              
              <div className="flex flex-col gap-2">
                <Label htmlFor="trueCfg">True CFG: {trueCfg}</Label>
                <Slider 
                  id="trueCfg" 
                  value={[trueCfg]} 
                  onValueChange={(value) => {
                    setTrueCfg(value[0]);
                    clearResults();
                  }}
                  min={0} max={5} step={0.1}
                />
              </div>
              
              <div className="flex flex-col gap-2">
                <Label htmlFor="cfgStartStep">CFG Start Step: {cfgStartStep}</Label>
                <Slider 
                  id="cfgStartStep" 
                  value={[cfgStartStep]} 
                  onValueChange={(value) => {
                    setCfgStartStep(value[0]);
                    clearResults();
                  }}
                  min={0} max={numSteps} step={1}
                />
              </div>
              
              <div className="flex flex-col gap-2">
                <Label htmlFor="cfgEndStep">CFG End Step: {cfgEndStep}</Label>
                <Slider 
                  id="cfgEndStep" 
                  value={[cfgEndStep]} 
                  onValueChange={(value) => {
                    setCfgEndStep(value[0]);
                    clearResults();
                  }}
                  min={0} max={numSteps} step={1}
                />
              </div>
              
              <div className="flex flex-col gap-2">
                <Label htmlFor="firstStepGuidance">First Step Guidance: {firstStepGuidance}</Label>
                <Slider 
                  id="firstStepGuidance" 
                  value={[firstStepGuidance]} 
                  onValueChange={(value) => {
                    setFirstStepGuidance(value[0]);
                    clearResults();
                  }}
                  min={0} max={10} step={0.1}
                />
              </div>
              
              <div className="flex flex-col gap-2">
                <Label htmlFor="negGuidance">Negative Guidance: {negGuidance}</Label>
                <Slider 
                  id="negGuidance" 
                  value={[negGuidance]} 
                  onValueChange={(value) => {
                    setNegGuidance(value[0]);
                    clearResults();
                  }}
                  min={0} max={10} step={0.1}
                />
              </div>
              
              <div className="md:col-span-2 flex flex-col gap-2">
                <Label htmlFor="negPrompt">Negative Prompt</Label>
                <Textarea 
                  id="negPrompt"
                  placeholder="Negative prompt (things to avoid in the image)" 
                  rows={2} 
                  value={negPromptText}
                  onChange={(e) => {
                    setNegPromptText(e.target.value);
                    clearResults();
                  }}
                />
              </div>
            </div>
          )}
        </section>
        
        {/* Submit Button Section */}
        <section className="flex flex-col items-center gap-4 py-6">
          {isLoading && (
            <div className="w-full max-w-xs">
              <Progress value={progressValue} className="w-full h-2" />
              <p className="text-sm text-muted-foreground text-center mt-2">Generating, please wait...</p>
            </div>
          )}
          <Button 
            size="lg" 
            className="w-full md:w-auto disabled:opacity-70"
            onClick={handleSubmit} 
            disabled={isLoading || !refImage1 || !promptText.trim()}
          >
            {isLoading ? 'Processing...' : '✨ Generate Image'}
          </Button>
        </section>

        {/* Error Display */}
        {error && <p className="text-red-500 text-center font-medium py-4">Error: {error}</p>}
        
        {/* Result Display */}
        {resultImage && !isLoading && (
          <section className="flex flex-col gap-4 p-6 border rounded-lg shadow-sm items-center">
            <h2 className="text-xl font-semibold">Generated Result</h2>
            <Image src={resultImage} alt="Generated image" width={512} height={512} className="rounded-md object-contain max-h-[512px]" unoptimized />
            
            {usedSeed && (
              <div className="text-sm text-muted-foreground mt-2">
                Used Seed: <code className="bg-muted p-1 rounded">{usedSeed}</code>
              </div>
            )}
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                if (resultImage) {
                  const link = document.createElement('a');
                  link.href = resultImage;
                  link.download = `dreamo-image-${Date.now()}.jpg`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }
              }}
              className="mt-2"
            >
              Download Image
            </Button>
          </section>
        )}

        {!resultImage && !isLoading && !error && (refImage1 || refImage2) && (
          <div className="w-full aspect-square bg-muted rounded-md flex items-center justify-center text-muted-foreground min-h-[200px] max-h-[512px]">
            <span>Generated image will appear here</span>
          </div>
        )}
      </main>

      <footer className="w-full text-center py-8 mt-12 border-t">
        <p className="text-sm text-muted-foreground">Powered by Hugging Face ByteDance/DreamO & shadcn/ui</p>
      </footer>
    </div>
  );
}
