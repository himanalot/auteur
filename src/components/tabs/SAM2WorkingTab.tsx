import React, { useState } from 'react';

declare global {
  interface Window {
    executeScriptSilent: (script: string) => Promise<any>;
  }
}

const SAM2WorkingTab: React.FC = () => {
  const [videoPath, setVideoPath] = useState('');
  const [textPrompt, setTextPrompt] = useState('remove the keyboard');
  const [result, setResult] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [modelSize, setModelSize] = useState('large');

  const getActiveCompVideo = async () => {
    try {
      setResult(prev => prev + '\n🎬 Getting active composition video...');
      
      const getVideoScript = `
        try {
          if (!app.project.activeItem || !(app.project.activeItem instanceof CompItem)) {
            JSON.stringify({success: false, error: "No active composition"});
          } else {
            var comp = app.project.activeItem;
            var videoLayer = null;
            var videoPath = "";
            
            for (var i = 1; i <= comp.numLayers; i++) {
              var layer = comp.layer(i);
              if (layer.source && layer.source instanceof FootageItem && layer.source.hasVideo) {
                videoLayer = layer;
                if (layer.source.mainSource && layer.source.mainSource.file) {
                  videoPath = layer.source.mainSource.file.fsName;
                } else if (layer.source.file) {
                  videoPath = layer.source.file.fsName;
                }
                break;
              }
            }
            
            if (videoLayer && videoPath) {
              JSON.stringify({
                success: true, 
                videoPath: videoPath,
                layerName: videoLayer.name,
                compName: comp.name
              });
            } else {
              JSON.stringify({success: false, error: "No video layer found"});
            }
          }
        } catch (error) {
          JSON.stringify({success: false, error: error.toString()});
        }
      `;
      
      if ((window as any).CSInterface) {
        const csInterface = new (window as any).CSInterface();
        csInterface.evalScript(getVideoScript, (result: string) => {
          try {
            const parsedResult = JSON.parse(result);
            if (parsedResult.success) {
              setVideoPath(parsedResult.videoPath);
              setResult(prev => prev + `\n✅ Found video: ${parsedResult.layerName}`);
              setResult(prev => prev + `\n📁 Path: ${parsedResult.videoPath}`);
            } else {
              setResult(prev => prev + `\n❌ ${parsedResult.error}`);
            }
          } catch (parseError) {
            setResult(prev => prev + `\n❌ Parse error: ${parseError}`);
          }
        });
      }
    } catch (error) {
      setResult(prev => prev + `\n❌ Error: ${error}`);
    }
  };

  const runSAM2Processing = async () => {
    if (!textPrompt.trim()) {
      setResult('❌ Please provide a text prompt');
      return;
    }

    if (!videoPath.trim()) {
      setResult('❌ Please get video from active composition first');
      return;
    }

    setIsProcessing(true);
    setResult(prev => prev + '\n🚀 Starting SAM2 processing with working script...');
    
    try {
      const outputDir = '/Users/ishanramrakhiani/Desktop/sam2_output/';
      const sam2Script = '/Users/ishanramrakhiani/Library/Application Support/Adobe/CEP/extensions/Maximise AE Tools/sam2/real_sam2_processor.py';
      
      // Build the exact command that works
      const command = `cd "/Users/ishanramrakhiani/Library/Application Support/Adobe/CEP/extensions/Maximise AE Tools/sam2" && /opt/anaconda3/bin/python3 real_sam2_processor.py "${videoPath}" "${textPrompt}" "${outputDir}" "${modelSize}"`;
      
      setResult(prev => prev + `\n⚡ Command: ${command}`);
      
      const extendScript = `
        try {
          var command = ${JSON.stringify(command)};
          var result = system.callSystem(command);
          JSON.stringify({
            success: true, 
            exitCode: result,
            command: command
          });
        } catch (error) {
          JSON.stringify({
            success: false, 
            error: error.toString()
          });
        }
      `;
      
      if ((window as any).CSInterface) {
        const csInterface = new (window as any).CSInterface();
        csInterface.evalScript(extendScript, (result: string) => {
          try {
            const parsedResult = JSON.parse(result);
            if (parsedResult.success) {
              setResult(prev => prev + `\n✅ SAM2 processing completed (exit code: ${parsedResult.exitCode})`);
              
              // Wait then read the result
              setTimeout(() => {
                readSAM2Result(outputDir);
              }, 2000);
            } else {
              setResult(prev => prev + `\n❌ Processing failed: ${parsedResult.error}`);
              setIsProcessing(false);
            }
          } catch (parseError) {
            setResult(prev => prev + `\n❌ Parse error: ${parseError}`);
            setIsProcessing(false);
          }
        });
      }
    } catch (error) {
      setResult(prev => prev + `\n❌ Error: ${error}`);
      setIsProcessing(false);
    }
  };

  const testAETools = async () => {
    setResult(prev => prev + '\n🔧 Testing SAM2 Simple Script...');
    
    // Get the correct extension path from CSInterface
    const csInterface = new (window as any).CSInterface();
    const extensionPath = csInterface.getSystemPath('extension');
    
    const debugScript = `
      try {
        // Test the simple SAM2 mask script
        var sam2MaskFile = new File("${extensionPath}/jsx/sam2_mask_simple.jsx");
        if (!sam2MaskFile.exists) {
          JSON.stringify({success: false, error: "SAM2 mask file not found at: " + sam2MaskFile.fsName});
        } else {
          // Load and test the script
          eval(sam2MaskFile.read());
          
          if (typeof applySAM2Mask !== "function") {
            JSON.stringify({success: false, error: "applySAM2Mask function not found after loading sam2_mask_simple.jsx"});
          } else {
            JSON.stringify({success: true, message: "SAM2 Simple Script loaded successfully!", functionExists: true});
          }
        }
      } catch (error) {
        JSON.stringify({success: false, error: error.toString()});
      }
    `;
    
    if ((window as any).CSInterface) {
      const csInterface = new (window as any).CSInterface();
      csInterface.evalScript(debugScript, (result: string) => {
        try {
          const parsedResult = JSON.parse(result);
          if (parsedResult.success) {
            setResult(prev => prev + `\n✅ AE Tools Debug SUCCESS!\n📦 Total tools: ${parsedResult.availableTools}\n🎭 SAM2 tool: ${parsedResult.sam2Tool ? 'Found' : 'Missing'}\n💬 ${parsedResult.message}`);
          } else if (parsedResult.debug) {
            setResult(prev => prev + `\n🔍 Debug Info:\n📁 Extension Path: ${parsedResult.debug.extensionPath}\n📄 Tools File: ${parsedResult.debug.toolsFilePath}\n✅ File Exists: ${parsedResult.debug.toolsFileExists}\n📍 Current Path: ${parsedResult.debug.currentPath}\n🎯 FileName: ${parsedResult.debug.fileName}`);
          } else {
            setResult(prev => prev + `\n❌ AE Tools Debug FAILED: ${parsedResult.error}`);
          }
        } catch (parseError) {
          setResult(prev => prev + `\n❌ Debug parse error: ${parseError}\n📤 Raw result: ${result}`);
        }
      });
    }
  };

  const readSAM2Result = async (outputDir: string) => {
    const readScript = `
      try {
        var resultFile = new File("${outputDir}/REAL_sam2_result.json");
        if (resultFile.exists) {
          resultFile.open("r");
          var content = resultFile.read();
          resultFile.close();
          content;
        } else {
          "FILE_NOT_FOUND";
        }
      } catch (error) {
        "ERROR: " + error.toString();
      }
    `;
    
    if ((window as any).CSInterface) {
      const csInterface = new (window as any).CSInterface();
      csInterface.evalScript(readScript, (content: string) => {
        if (content === "FILE_NOT_FOUND") {
          setResult(prev => prev + '\n❌ No result file generated');
          setIsProcessing(false);
        } else if (content.startsWith("ERROR:")) {
          setResult(prev => prev + `\n❌ Error reading result: ${content}`);
          setIsProcessing(false);
        } else {
          try {
            const sam2Result = JSON.parse(content);
            if (sam2Result.success) {
              setResult(prev => prev + `\n\n🎉 SAM2 SUCCESS!\n🎭 Contour Points: ${sam2Result.contour_points}\n🔍 Detection: ${sam2Result.detection_method}\n🤖 Model: ${sam2Result.sam2_model}\n🔧 Device: ${sam2Result.device}\n📊 Frames: ${sam2Result.frame_count}\n\n🎨 Creating masks in After Effects...`);
              
              // Apply masks using our enhanced integration
              if (sam2Result.ae_script_data) {
                applyMasksToAE(sam2Result.ae_script_data);
              } else {
                setResult(prev => prev + '\n⚠️ No AE script data found');
                setIsProcessing(false);
              }
            } else {
              setResult(prev => prev + `\n❌ SAM2 failed: ${sam2Result.error}`);
              setIsProcessing(false);
            }
          } catch (parseError) {
            setResult(prev => prev + `\n📤 Raw result:\n${content.substring(0, 500)}...`);
            setIsProcessing(false);
          }
        }
      });
    }
  };

  const testHardcodedMask = async () => {
    setResult(prev => prev + '\n🧪 Testing hardcoded sample mask contours...');
    
    // Get the correct extension path from CSInterface
    const csInterface = new (window as any).CSInterface();
    const extensionPath = csInterface.getSystemPath('extension');
    
    // Hardcoded sample contours - simple rectangle shape
    const sampleContours = [
      [100, 100],   // Top-left
      [300, 100],   // Top-right  
      [300, 200],   // Bottom-right
      [100, 200]    // Bottom-left
    ];
    
    const applyMaskScript = `
      try {
        // Load the simple SAM2 mask script
        var sam2MaskFile = new File("${extensionPath}/jsx/sam2_mask_simple.jsx");
        if (!sam2MaskFile.exists) {
          JSON.stringify({success: false, error: "SAM2 mask file not found at: " + sam2MaskFile.fsName});
        } else {
          sam2MaskFile.open("r");
          var scriptContent = sam2MaskFile.read();
          sam2MaskFile.close();
          eval(scriptContent);
          
          // Check if function exists
          if (typeof applySAM2Mask !== "function") {
            JSON.stringify({success: false, error: "applySAM2Mask function not found after loading script"});
          } else {
            // Apply the hardcoded test mask
            var result = applySAM2Mask(
              ${JSON.stringify(sampleContours)},
              "subtract",
              3,
              100,
              true,
              "Test SAM2 Mask"
            );
            JSON.stringify(result ? JSON.parse(result) : {success: false, error: "No result returned"});
          }
        }
      } catch (error) {
        JSON.stringify({success: false, error: error.toString()});
      }
    `;
    
    if ((window as any).CSInterface) {
      const csInterface = new (window as any).CSInterface();
      csInterface.evalScript(applyMaskScript, (result: string) => {
        try {
          const parsedResult = JSON.parse(result);
          if (parsedResult.success) {
            setResult(prev => prev + `\n\n🧪 ✅ TEST MASK APPLIED SUCCESSFULLY!\n🎭 Layers Masked: ${parsedResult.data?.layersMasked}\n🔍 Contour Points: ${parsedResult.data?.contourPoints}\n🎯 Mask Mode: ${parsedResult.data?.maskMode}\n🌟 Smooth Curves: ${parsedResult.data?.smooth}\n\n💡 Check your selected layer - should see a rectangular mask!`);
          } else {
            setResult(prev => prev + `\n❌ Test mask failed: ${parsedResult.message}`);
          }
        } catch (parseError) {
          setResult(prev => prev + `\n❌ Test parse error: ${parseError}`);
        }
      });
    }
  };

  const applyMasksToAE = async (aeScriptData: any) => {
    // Get the correct extension path from CSInterface
    const csInterface = new (window as any).CSInterface();
    const extensionPath = csInterface.getSystemPath('extension');
    
    const params = aeScriptData.parameters;
    const applyMaskScript = `
      try {
        // Load the simple SAM2 mask script
        var sam2MaskFile = new File("${extensionPath}/jsx/sam2_mask_simple.jsx");
        if (!sam2MaskFile.exists) {
          JSON.stringify({success: false, error: "SAM2 mask file not found at: " + sam2MaskFile.fsName});
        } else {
          eval(sam2MaskFile.read());
          
          // Apply the SAM2 mask directly
          var result = applySAM2Mask(
            ${JSON.stringify(params.maskContours)},
            "${params.maskMode}",
            ${params.feather},
            ${params.opacity},
            ${params.smooth},
            "${params.name}"
          );
          result;
        }
      } catch (error) {
        JSON.stringify({success: false, error: error.toString()});
      }
    `;
    
    if ((window as any).CSInterface) {
      const csInterface = new (window as any).CSInterface();
      csInterface.evalScript(applyMaskScript, (result: string) => {
        try {
          const parsedResult = JSON.parse(result);
          if (parsedResult.success) {
            setResult(prev => prev + `\n\n🎨 ✅ MASKS APPLIED TO AFTER EFFECTS!\n🎭 Layers Masked: ${parsedResult.data?.layersMasked}\n🔍 Contour Points: ${parsedResult.data?.contourPoints}\n🎯 Mask Mode: ${parsedResult.data?.maskMode}\n🌟 Smooth Curves: ${parsedResult.data?.smooth}\n\n💡 Check your video layer - the object should now be masked out!`);
          } else {
            setResult(prev => prev + `\n❌ Mask application failed: ${parsedResult.message}`);
          }
        } catch (parseError) {
          setResult(prev => prev + `\n❌ Mask parse error: ${parseError}`);
        }
        setIsProcessing(false);
      });
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      backgroundColor: '#2c3e50',
      color: '#ecf0f1',
      fontFamily: 'Segoe UI, system-ui, sans-serif'
    }}>
      {/* Header */}
      <div style={{ 
        backgroundColor: '#34495e', 
        borderBottom: '1px solid #ffffff1a', 
        padding: '16px' 
      }}>
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          color: '#ecf0f1', 
          margin: '0 0 8px 0' 
        }}>
          🎭 SAM2 Working Implementation
        </h2>
        <p style={{ 
          fontSize: '14px', 
          color: '#bdc3c7', 
          margin: 0 
        }}>
          Uses the verified working SAM2 script that generates proper masks
        </p>
      </div>

      {/* Main Content */}
      <div style={{ 
        display: 'flex', 
        gap: '16px', 
        padding: '16px', 
        flex: 1, 
        minHeight: 0 
      }}>
        
        {/* Controls Panel */}
        <div style={{ width: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Video Selection */}
          <div style={{ 
            backgroundColor: '#1b1d21', 
            border: '1px solid #ffffff1a', 
            borderRadius: '8px', 
            padding: '16px' 
          }}>
            <h3 style={{ 
              fontSize: '16px', 
              fontWeight: '500', 
              color: '#ecf0f1', 
              margin: '0 0 12px 0' 
            }}>
              🎬 Video Source
            </h3>
            
            {videoPath ? (
              <div style={{ marginBottom: '12px' }}>
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  color: '#ecf0f1', 
                  marginBottom: '4px' 
                }}>
                  Selected Video:
                </div>
                <div style={{
                  padding: '8px 12px',
                  fontSize: '12px',
                  border: '1px solid #ffffff1a',
                  borderRadius: '6px',
                  backgroundColor: '#2c3e50',
                  color: '#bdc3c7',
                  wordBreak: 'break-all'
                }}>
                  {videoPath}
                </div>
              </div>
            ) : (
              <div style={{ 
                fontSize: '14px', 
                color: '#bdc3c7', 
                marginBottom: '12px' 
              }}>
                No video selected. Click "Get from Active Comp" to scan.
              </div>
            )}
            
            <button
              onClick={getActiveCompVideo}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '14px',
                fontWeight: '500',
                border: '1px solid #ffffff1a',
                borderRadius: '6px',
                backgroundColor: '#34495e',
                color: '#ecf0f1',
                cursor: 'pointer'
              }}
              onMouseOver={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#3498db'}
              onMouseOut={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#34495e'}
            >
              🎬 Get from Active Comp
            </button>
          </div>

          {/* Settings */}
          <div style={{ 
            backgroundColor: '#1b1d21', 
            border: '1px solid #ffffff1a', 
            borderRadius: '8px', 
            padding: '16px' 
          }}>
            <h3 style={{ 
              fontSize: '16px', 
              fontWeight: '500', 
              color: '#ecf0f1', 
              margin: '0 0 12px 0' 
            }}>
              ⚙️ SAM2 Settings
            </h3>
            
            <div style={{ marginBottom: '12px' }}>
              <label style={{ 
                fontSize: '14px', 
                fontWeight: '500', 
                color: '#ecf0f1', 
                display: 'block', 
                marginBottom: '4px' 
              }}>
                Text Prompt:
              </label>
              <input
                type="text"
                value={textPrompt}
                onChange={(e) => setTextPrompt(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '14px',
                  border: '1px solid #ffffff1a',
                  borderRadius: '6px',
                  backgroundColor: '#2c3e50',
                  color: '#ecf0f1',
                  boxSizing: 'border-box'
                }}
                placeholder="e.g., 'remove the keyboard'"
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ 
                fontSize: '14px', 
                fontWeight: '500', 
                color: '#ecf0f1', 
                display: 'block', 
                marginBottom: '4px' 
              }}>
                Model Size:
              </label>
              <select
                value={modelSize}
                onChange={(e) => setModelSize(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '14px',
                  border: '1px solid #ffffff1a',
                  borderRadius: '6px',
                  backgroundColor: '#2c3e50',
                  color: '#ecf0f1'
                }}
              >
                <option value="tiny">🚀 Tiny (Fastest)</option>
                <option value="small">⚡ Small (Fast)</option>
                <option value="base+">🎯 Base+ (Balanced)</option>
                <option value="large">🎨 Large (Best Quality)</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div style={{ 
            backgroundColor: '#1b1d21', 
            border: '1px solid #ffffff1a', 
            borderRadius: '8px', 
            padding: '16px' 
          }}>
            <h3 style={{ 
              fontSize: '16px', 
              fontWeight: '500', 
              color: '#ecf0f1', 
              margin: '0 0 12px 0' 
            }}>
              🚀 Actions
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={runSAM2Processing}
                disabled={isProcessing || !textPrompt.trim() || !videoPath.trim()}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: isProcessing || !textPrompt.trim() || !videoPath.trim()
                    ? '#6b7280' : '#22c55e',
                  color: 'white',
                  cursor: isProcessing || !textPrompt.trim() || !videoPath.trim()
                    ? 'not-allowed' : 'pointer'
                }}
              >
                {isProcessing ? '🔄 Processing...' : '🎭 Run SAM2 Processing'}
              </button>
              
              <button
                onClick={testAETools}
                style={{
                  width: '100%',
                  padding: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  border: '1px solid #3498db',
                  borderRadius: '6px',
                  backgroundColor: '#34495e',
                  color: '#3498db',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = '#3498db';
                  (e.target as HTMLButtonElement).style.color = 'white';
                }}
                onMouseOut={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = '#34495e';
                  (e.target as HTMLButtonElement).style.color = '#3498db';
                }}
              >
                🔧 Test AE Tools Debug
              </button>
              
              <button
                onClick={testHardcodedMask}
                style={{
                  width: '100%',
                  padding: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  border: '1px solid #f39c12',
                  borderRadius: '6px',
                  backgroundColor: '#34495e',
                  color: '#f39c12',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = '#f39c12';
                  (e.target as HTMLButtonElement).style.color = 'white';
                }}
                onMouseOut={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = '#34495e';
                  (e.target as HTMLButtonElement).style.color = '#f39c12';
                }}
              >
                🧪 Test Hardcoded Mask
              </button>
              
              <button
                onClick={() => {
                  setResult('');
                  setVideoPath('');
                }}
                style={{
                  width: '100%',
                  padding: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  border: '1px solid #bdc3c7',
                  borderRadius: '6px',
                  backgroundColor: '#34495e',
                  color: '#bdc3c7',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = '#95a5a6';
                  (e.target as HTMLButtonElement).style.color = 'white';
                }}
                onMouseOut={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor = '#34495e';
                  (e.target as HTMLButtonElement).style.color = '#bdc3c7';
                }}
              >
                🔄 Reset
              </button>
            </div>
          </div>
        </div>

        {/* Result Display */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            marginBottom: '12px' 
          }}>
            <h3 style={{ 
              fontSize: '16px', 
              fontWeight: '500', 
              color: '#ecf0f1', 
              margin: 0 
            }}>
              📊 Processing Log
            </h3>
            <button
              onClick={() => setResult('')}
              style={{
                padding: '4px 12px',
                fontSize: '12px',
                border: '1px solid #ffffff1a',
                borderRadius: '4px',
                backgroundColor: '#6b7280',
                color: 'white',
                cursor: 'pointer'
              }}
              onMouseOver={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#95a5a6'}
              onMouseOut={(e) => (e.target as HTMLButtonElement).style.backgroundColor = '#6b7280'}
            >
              Clear
            </button>
          </div>
          
          <div style={{
            flex: 1,
            width: '100%',
            padding: '16px',
            fontSize: '12px',
            fontFamily: 'Fira Code, SF Mono, Monaco, Cascadia Code, monospace',
            border: '1px solid #ffffff1a',
            borderRadius: '8px',
            backgroundColor: '#1a1a1a',
            color: '#f8f8f2',
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            minHeight: 0
          }}>
            {result || `🎭 SAM2 Working Implementation Ready!

🎯 Current Settings:
🎬 Video: ${videoPath || 'Not selected'}
💬 Prompt: "${textPrompt}"
🤖 Model: ${modelSize}

🔄 Workflow:
1. Get video from active After Effects composition
2. Run the verified SAM2 Python script
3. Generate adaptive contour points (4-50+ depending on object complexity)
4. Apply precise masks to After Effects using enhanced integration
5. Object removed with smooth, accurate masks!

✅ This uses the WORKING script that successfully generated:
🎭 7 contour points for keyboard
🔍 YOLOv8 detection
🤖 SAM2 large model
🔧 MPS device (Apple Silicon)

Ready to process when you select a video!`}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SAM2WorkingTab;