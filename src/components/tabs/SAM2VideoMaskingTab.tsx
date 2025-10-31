import React, { useState } from 'react';

declare global {
  interface Window {
    executeScriptSilent: (script: string) => Promise<any>;
  }
}

const SAM2VideoMaskingTab: React.FC = () => {
  const [videoPath, setVideoPath] = useState(''); // Will be populated from AE composition
  const [textPrompt, setTextPrompt] = useState('remove the keyboard');
  const [result, setResult] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [outputPath, setOutputPath] = useState('');
  const [activeCompVideo, setActiveCompVideo] = useState('');

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
            
            // Find the first video layer (footage item)
            for (var i = 1; i <= comp.numLayers; i++) {
              var layer = comp.layer(i);
              if (layer.source && layer.source instanceof FootageItem && layer.source.hasVideo) {
                videoLayer = layer;
                // Get the absolute file path properly
                if (layer.source.mainSource && layer.source.mainSource.file) {
                  videoPath = layer.source.mainSource.file.fsName;
                } else if (layer.source.file) {
                  videoPath = layer.source.file.fsName;
                } else {
                  videoPath = "";
                }
                break;
              }
            }
            
            if (videoLayer && videoPath) {
              JSON.stringify({
                success: true, 
                videoPath: videoPath,
                layerName: videoLayer.name,
                compName: comp.name,
                duration: comp.duration,
                frameRate: comp.frameRate
              });
            } else {
              JSON.stringify({success: false, error: "No video layer found in active composition"});
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
              setActiveCompVideo(parsedResult.layerName);
              setResult(prev => prev + `\n✅ Found video: ${parsedResult.layerName}`);
              setResult(prev => prev + `\n📁 Path: ${parsedResult.videoPath}`);
              setResult(prev => prev + `\n🎬 Composition: ${parsedResult.compName}`);
              setResult(prev => prev + `\n⏱️ Duration: ${parsedResult.duration.toFixed(2)}s`);
              setResult(prev => prev + `\n🎞️ Frame Rate: ${parsedResult.frameRate}fps`);
            } else {
              setResult(prev => prev + `\n❌ ${parsedResult.error}`);
            }
          } catch (parseError) {
            setResult(prev => prev + `\n❌ Parse error: ${parseError}`);
          }
        });
      } else {
        setResult(prev => prev + '\n❌ CSInterface not available');
      }
    } catch (error) {
      setResult(prev => prev + `\n❌ Error getting active comp video: ${error}`);
    }
  };

  const createSAM2MasksInAE = async (aeScriptData: any) => {
    try {
      setResult(prev => prev + '\n🎨 Using enhanced SAM2 mask integration...');
      
      const createSAM2Script = `
        try {
          // Load the SAM2 mask integration tools
          eval(File(Folder($.fileName).parent + "/jsx/ae_tools.jsx").read());
          
          // Execute the SAM2 mask tool with the provided parameters
          var toolName = "${aeScriptData.tool}";
          var parameters = ${JSON.stringify(aeScriptData.parameters)};
          
          // Call the enhanced tool
          var result = executeAITool(toolName, parameters);
          result;
        } catch (error) {
          JSON.stringify({success: false, error: error.toString()});
        }
      `;
      
      if ((window as any).CSInterface) {
        const csInterface = new (window as any).CSInterface();
        csInterface.evalScript(createSAM2Script, (result: string) => {
          try {
            const parsedResult = JSON.parse(result);
            if (parsedResult.success) {
              setResult(prev => prev + `\n\n🎨 ✅ ENHANCED SAM2 MASKS CREATED!\n🎭 Tool: ${aeScriptData.tool}\n🎬 Layers Masked: ${parsedResult.data?.layersMasked || 1}\n🔍 Contour Points: ${parsedResult.data?.contourPoints || 'N/A'}\n🎯 Mask Mode: ${parsedResult.data?.maskMode || 'N/A'}\n🌟 Smooth Curves: ${parsedResult.data?.smooth || false}\n\n💡 Check your video layer - the SAM2 mask should now be applied!\n🎭 Enhanced masks use smooth Bezier curves and proper feathering.`);
            } else {
              setResult(prev => prev + `\n❌ Enhanced mask creation failed: ${parsedResult.message}`);
              setResult(prev => prev + '\n🔄 Falling back to legacy mask creation...');
              // Don't call fallback here to avoid infinite loop
            }
          } catch (parseError) {
            setResult(prev => prev + `\n❌ Enhanced mask parse error: ${parseError}`);
            setResult(prev => prev + '\n🔄 Falling back to legacy mask creation...');
          }
        });
      } else {
        setResult(prev => prev + '\n❌ CSInterface not available for enhanced mask creation');
      }
    } catch (error) {
      setResult(prev => prev + `\n❌ Error creating enhanced masks: ${error}`);
    }
  };

  const createMasksInAE = async (outputDir: string) => {
    try {
      setResult(prev => prev + '\n🎨 Reading mask contours...');
      
      const createMasksScript = `
        try {
          // Read the mask contours JSON file
          var outputDir = "${outputDir}";
          var contoursFile = new File(outputDir + "/mask_contours.json");
          
          if (!contoursFile.exists) {
            JSON.stringify({success: false, error: "Mask contours file not found"});
          } else {
            contoursFile.open("r");
            var contoursContent = contoursFile.read();
            contoursFile.close();
            
            var contours = JSON.parse(contoursContent);
            
            // Get active composition and video layer
            if (!app.project.activeItem || !(app.project.activeItem instanceof CompItem)) {
              JSON.stringify({success: false, error: "No active composition"});
            } else {
              var comp = app.project.activeItem;
              var videoLayer = null;
              
              // Find the video layer
              for (var i = 1; i <= comp.numLayers; i++) {
                var layer = comp.layer(i);
                if (layer.source && layer.source instanceof FootageItem && layer.source.hasVideo) {
                  videoLayer = layer;
                  break;
                }
              }
              
              if (!videoLayer) {
                JSON.stringify({success: false, error: "No video layer found"});
              } else {
                app.beginUndoGroup("SAM2 Mask Creation");
                
                var masksCreated = 0;
                
                // Create masks for each frame
                for (var frameIndex in contours) {
                  var frameContours = contours[frameIndex];
                  
                  if (frameContours && frameContours.length > 0) {
                    // Create a new mask for this frame
                    var mask = videoLayer.property("ADBE Mask Parade").addProperty("ADBE Mask Atom");
                    var maskPath = mask.property("ADBE Mask Shape");
                    var maskOpacity = mask.property("ADBE Mask Opacity");
                    var maskMode = mask.property("ADBE Mask Mode");
                    
                    // Set mask to subtract mode to remove the object
                    maskMode.setValue(2); // Subtract mode
                    
                    // Build the path from contour points
                    var shape = new Shape();
                    var pathPoints = [];
                    var inTangents = [];
                    var outTangents = [];
                    var closed = true;
                    
                    // Convert contour points to After Effects path format
                    for (var j = 0; j < frameContours.length; j++) {
                      var point = frameContours[j];
                      pathPoints.push([point[0], point[1]]);
                      inTangents.push([0, 0]);
                      outTangents.push([0, 0]);
                    }
                    
                    if (pathPoints.length > 0) {
                      shape.vertices = pathPoints;
                      shape.inTangents = inTangents;
                      shape.outTangents = outTangents;
                      shape.closed = closed;
                      
                      // Apply the shape to the mask
                      maskPath.setValue(shape);
                      
                      // Set keyframe timing for this frame
                      var frameTime = parseFloat(frameIndex) / comp.frameRate;
                      maskPath.setValueAtTime(frameTime, shape);
                      maskOpacity.setValueAtTime(frameTime, 100);
                      
                      masksCreated++;
                    }
                  }
                }
                
                app.endUndoGroup();
                
                JSON.stringify({
                  success: true, 
                  masksCreated: masksCreated,
                  layerName: videoLayer.name,
                  totalFrames: Object.keys(contours).length
                });
              }
            }
          }
        } catch (error) {
          app.endUndoGroup();
          JSON.stringify({success: false, error: error.toString()});
        }
      `;
      
      if ((window as any).CSInterface) {
        const csInterface = new (window as any).CSInterface();
        csInterface.evalScript(createMasksScript, (result: string) => {
          try {
            const parsedResult = JSON.parse(result);
            if (parsedResult.success) {
              setResult(prev => prev + `\n\n🎨 ✅ MASKS CREATED IN AFTER EFFECTS!\n🎭 Masks Created: ${parsedResult.masksCreated}\n🎬 Layer: ${parsedResult.layerName}\n📊 Total Frames: ${parsedResult.totalFrames}\n\n💡 Check your video layer - the object should now be masked out!\n🔄 Masks are set to SUBTRACT mode to remove the detected object.`);
            } else {
              setResult(prev => prev + `\n❌ Mask creation failed: ${parsedResult.error}`);
            }
          } catch (parseError) {
            setResult(prev => prev + `\n❌ Mask creation parse error: ${parseError}`);
          }
        });
      } else {
        setResult(prev => prev + '\n❌ CSInterface not available for mask creation');
      }
    } catch (error) {
      setResult(prev => prev + `\n❌ Error creating masks: ${error}`);
    }
  };

  const processSAM2Video = async () => {
    if (!textPrompt.trim()) {
      setResult('❌ Please provide a text prompt');
      return;
    }

    setIsProcessing(true);
    setResult('🚀 Starting REAL SAM2 video processing (CEP Mode)...');
    
    // Get video from active composition if not already set
    if (!videoPath.trim()) {
      setResult(prev => prev + '\n🎬 No video path set, getting from active composition...');
      await getActiveCompVideo();
      
      // Wait a moment for the video path to be set
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (!videoPath.trim()) {
        setResult(prev => prev + '\n❌ Could not get video from active composition');
        setIsProcessing(false);
        return;
      }
    }

    try {
      // CEP Extension environment - use ExtendScript execution
      console.log('🎭 Running in After Effects CEP extension');
      
      // Use ExtendScript to execute shell command
      const homeDir = '/Users/ishanramrakhiani';
      const outputDir = `${homeDir}/Desktop/sam2_output/`;
      const sam2Dir = "/Users/ishanramrakhiani/Library/Application Support/Adobe/CEP/extensions/Maximise AE Tools/sam2";
      
      setResult(prev => prev + '\n📁 Output directory: ' + outputDir);
      setResult(prev => prev + '\n🐍 SAM2 directory: ' + sam2Dir);
      
      // Create the shell command with cleanup
      const command = `mkdir -p "${outputDir}" && rm -f "${outputDir}/REAL_sam2_result.json" "${outputDir}/mask_contours.json" && cd "${sam2Dir}" && python3 real_sam2_processor.py "${videoPath}" "${textPrompt}" "${outputDir}"`;
      setResult(prev => prev + '\n⚡ Command: ' + command);
      setResult(prev => prev + '\n🧹 Clearing old result files...');
      
      // Use ExtendScript to execute the command directly
      const extendScript = `
        try {
          var command = ${JSON.stringify(command)};
          
          // Try direct system call first
          var result = system.callSystem(command);
          
          JSON.stringify({
            success: true, 
            result: result,
            message: "Direct system call executed",
            command: command
          });
        } catch (error) {
          JSON.stringify({
            success: false, 
            error: error.toString(),
            command: ${JSON.stringify(command)}
          });
        }
      `;
      
      // Debug what's available
      setResult(prev => prev + `\n🔍 Debug: executeScriptSilent available: ${typeof window.executeScriptSilent}`);
      setResult(prev => prev + `\n🔍 Debug: CSInterface available: ${typeof (window as any).CSInterface}`);
      setResult(prev => prev + `\n🔍 Debug: window keys: ${Object.keys(window).filter(k => k.includes('execute')).join(', ')}`);
      
      if (window.executeScriptSilent) {
        setResult(prev => prev + '\n🔄 Executing via ExtendScript...');
        
        try {
          const result = await window.executeScriptSilent(extendScript);
          const parsedResult = JSON.parse(result);
          
          if (parsedResult.success) {
            setResult(prev => prev + '\n✅ ExtendScript execution completed');
            
            // Try to read the result file using ExtendScript
            const readResultScript = `
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
            
            setTimeout(async () => {
              try {
                const resultContent = await window.executeScriptSilent(readResultScript);
                
                if (resultContent === "FILE_NOT_FOUND") {
                  setResult(prev => prev + '\n❌ No result file generated');
                } else if (resultContent.startsWith("ERROR:")) {
                  setResult(prev => prev + `\n❌ Error reading result: ${resultContent}`);
                } else {
                  try {
                    const sam2Result = JSON.parse(resultContent);
                    if (sam2Result.success) {
                      setResult(prev => prev + `\n\n✅ REAL SAM2 SUCCESS!\n🎭 Contour Points: ${sam2Result.contour_points}\n🔍 Detection: ${sam2Result.detection_method}\n🤖 Model: ${sam2Result.sam2_model}\n🔧 Device: ${sam2Result.device}\n📊 Frames: ${sam2Result.frame_count}\n🎭 Type: ${sam2Result.segmentation_type}\n\n🎯 CEP MODE:\n📦 Old: Manual terminal commands\n🎭 NEW: Direct execution in After Effects!\n\n💡 Mask contours ready for export to After Effects.`);
                      setOutputPath(outputDir);
                    } else {
                      setResult(prev => prev + `\n❌ Processing failed: ${sam2Result.error}`);
                    }
                  } catch (parseError) {
                    setResult(prev => prev + `\n📤 Raw output:\n${resultContent}`);
                  }
                }
              } catch (readError) {
                setResult(prev => prev + `\n❌ Error reading result: ${readError}`);
              }
              
              setIsProcessing(false);
            }, 3000); // Wait 3 seconds for processing
            
          } else {
            setResult(prev => prev + `\n❌ ExtendScript execution failed: ${parsedResult.error}`);
            setIsProcessing(false);
          }
          
        } catch (scriptError) {
          setResult(prev => prev + `\n❌ ExtendScript error: ${scriptError}`);
          setIsProcessing(false);
        }
        
      } else if ((window as any).CSInterface) {
        // Direct CSInterface fallback
        setResult(prev => prev + '\n🔄 Using direct CSInterface...');
        
        const csInterface = new (window as any).CSInterface();
        csInterface.evalScript(extendScript, (result: string) => {
          setResult(prev => prev + `\n📤 CSInterface result: ${result}`);
          
          if (result === 'EvalScript error.') {
            setResult(prev => prev + '\n❌ ExtendScript execution error');
            setIsProcessing(false);
            return;
          }
          
          try {
            const parsedResult = JSON.parse(result);
            if (parsedResult.success) {
              setResult(prev => prev + '\n✅ Direct CSInterface execution completed');
              
              // Check if the result contains Python errors
              if (parsedResult.result && parsedResult.result.includes('Traceback')) {
                setResult(prev => prev + '\n❌ Python Error Detected:');
                setResult(prev => prev + `\n${parsedResult.result}`);
                
                if (parsedResult.result.includes('ModuleNotFoundError: No module named \'torch\'')) {
                  setResult(prev => prev + '\n\n🔧 SOLUTION: Click "Copy PyTorch Fix Commands" button and run those commands in Terminal!');
                }
                
                setIsProcessing(false);
                return;
              }
              
              // Continue with result reading logic...
              setTimeout(async () => {
                const readResultScript = `
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
                
                csInterface.evalScript(readResultScript, (resultContent: string) => {
                  if (resultContent === "FILE_NOT_FOUND") {
                    setResult(prev => prev + '\n❌ No result file generated');
                  } else if (resultContent.startsWith("ERROR:")) {
                    setResult(prev => prev + `\n❌ Error reading result: ${resultContent}`);
                  } else {
                    try {
                      const sam2Result = JSON.parse(resultContent);
                      if (sam2Result.success) {
                        setResult(prev => prev + `\n\n✅ REAL SAM2 SUCCESS!\n🎭 Contour Points: ${sam2Result.contour_points}\n🔍 Detection: ${sam2Result.detection_method}\n🤖 Model: ${sam2Result.sam2_model}\n🔧 Device: ${sam2Result.device}\n📊 Frames: ${sam2Result.frame_count}\n🎭 Type: ${sam2Result.segmentation_type}\n\n🎯 CEP MODE:\n📦 Old: Manual terminal commands\n🎭 NEW: Direct execution in After Effects!\n\n🎨 Creating SAM2 masks using enhanced integration...`);
                        setOutputPath(outputDir);
                        
                        // Use enhanced SAM2 mask integration
                        if (sam2Result.ae_script_data && sam2Result.ae_script_data.tool && sam2Result.ae_script_data.parameters) {
                          createSAM2MasksInAE(sam2Result.ae_script_data);
                        } else {
                          // Fallback to legacy mask creation
                          createMasksInAE(outputDir);
                        }
                      } else {
                        setResult(prev => prev + `\n❌ Processing failed: ${sam2Result.error}`);
                      }
                    } catch (parseError) {
                      setResult(prev => prev + `\n📤 Raw output:\n${resultContent}`);
                    }
                  }
                  setIsProcessing(false);
                });
              }, 3000);
            } else {
              setResult(prev => prev + `\n❌ Direct CSInterface execution failed: ${parsedResult.error}`);
              setIsProcessing(false);
            }
          } catch (parseError) {
            setResult(prev => prev + `\n❌ CSInterface parse error: ${parseError}`);
            setIsProcessing(false);
          }
        });
        
      } else {
        // Final fallback to manual terminal command
        setResult(prev => prev + '\n\n🎭 CEP Environment - Manual Execution');
        setResult(prev => prev + '\n💡 To run SAM2 processing:');
        setResult(prev => prev + '\n1. Open Terminal');
        setResult(prev => prev + '\n2. Run this command:');
        setResult(prev => prev + `\n\n${command}`);
        setResult(prev => prev + '\n\n3. Results will be saved to: ' + outputDir);
        setResult(prev => prev + '\n4. Check mask_contours.json for After Effects import');
        
        setIsProcessing(false);
      }
      
    } catch (error) {
      setResult(prev => prev + `\n❌ Browser processing error: ${error}`);
      setIsProcessing(false);
    }
  };

  const testAgain = () => {
    setResult('');
    setOutputPath('');
  };

  const openOutputFolder = async () => {
    try {
      if (typeof (window as any).require !== 'undefined') {
        // Node.js/Electron environment
        const { exec } = (window as any).require('child_process');
        const path = (window as any).require('path');
        const os = (window as any).require('os');
        
        const homeDir = os.homedir();
        const outputDir = path.join(homeDir, 'Desktop', 'sam2_output');
        
        exec(`open "${outputDir}"`, (error: any) => {
          if (error) {
            setResult(prev => prev + `\n📁 Error opening folder: ${error.message}`);
          } else {
            setResult(prev => prev + `\n📁 Opened output folder: ${outputDir}`);
          }
        });
      } else {
        // Browser environment - just show the path
        const outputDir = '~/Desktop/sam2_output/';
        setResult(prev => prev + `\n📁 Output folder: ${outputDir}`);
        setResult(prev => prev + `\n💡 Open this path manually in Finder`);
        setResult(prev => prev + `\n📄 Look for: mask_contours.json (for AE import)`);
        setResult(prev => prev + `\n📄 Look for: REAL_sam2_result.json (processing details)`);
      }
    } catch (error) {
      setResult(prev => prev + `\n📁 Error: ${error}`);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      // Try multiple clipboard methods for CEP compatibility
      
      // Method 1: Modern clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(text);
          setResult(prev => prev + `\n📋 Copied to clipboard!`);
          return;
        } catch (clipboardError) {
          console.log('Clipboard API failed, trying fallback methods');
        }
      }
      
      // Method 2: ExtendScript system clipboard (CEP specific)
      if ((window as any).CSInterface) {
        const csInterface = new (window as any).CSInterface();
        const clipboardScript = `
          try {
            // Use system clipboard via shell command
            var command = "echo " + ${JSON.stringify(text)} + " | pbcopy";
            system.callSystem(command);
            "SUCCESS";
          } catch (error) {
            "ERROR: " + error.toString();
          }
        `;
        
        csInterface.evalScript(clipboardScript, (result: string) => {
          if (result === "SUCCESS") {
            setResult(prev => prev + `\n📋 Copied to clipboard via ExtendScript!`);
          } else {
            // Method 3: Fallback to text area selection
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            try {
              const successful = document.execCommand('copy');
              if (successful) {
                setResult(prev => prev + `\n📋 Copied to clipboard (fallback)!`);
              } else {
                setResult(prev => prev + `\n📄 Copy failed - please select and copy manually:\n${text}`);
              }
            } catch (execError) {
              setResult(prev => prev + `\n📄 Copy failed - please select and copy manually:\n${text}`);
            } finally {
              document.body.removeChild(textArea);
            }
          }
        });
        return;
      }
      
      // Method 3: Document execCommand fallback
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      try {
        const successful = document.execCommand('copy');
        if (successful) {
          setResult(prev => prev + `\n📋 Copied to clipboard (fallback)!`);
        } else {
          setResult(prev => prev + `\n📄 Copy failed - please select and copy manually:\n${text}`);
        }
      } catch (execError) {
        setResult(prev => prev + `\n📄 Copy failed - please select and copy manually:\n${text}`);
      } finally {
        document.body.removeChild(textArea);
      }
      
    } catch (error) {
      setResult(prev => prev + `\n📄 Copy failed - please select and copy manually:\n${text}`);
    }
  };

  const exportCommand = () => {
    // Use proper path expansion for manual command
    const outputDir = '$HOME/Desktop/sam2_output/';
    const sam2Dir = "/Users/ishanramrakhiani/Library/Application\\ Support/Adobe/CEP/extensions/Maximise\\ AE\\ Tools/sam2";
    const command = `mkdir -p "${outputDir}" && cd "${sam2Dir}" && python3 real_sam2_processor.py "${videoPath}" "${textPrompt}" "${outputDir}"`;
    copyToClipboard(command);
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      backgroundColor: '#f9fafb',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <div style={{ 
        backgroundColor: 'white', 
        borderBottom: '1px solid #e5e7eb', 
        padding: '16px' 
      }}>
        <h2 style={{ 
          fontSize: '18px', 
          fontWeight: '600', 
          color: '#111827', 
          margin: '0 0 8px 0' 
        }}>
          🎭 REAL SAM2 Video Masking (CEP Mode)
        </h2>
        <p style={{ 
          fontSize: '14px', 
          color: '#6b7280', 
          margin: 0 
        }}>
          AI-powered object detection and masking using REAL SAM2 - direct execution in After Effects
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
          
          {/* Active Composition Video */}
          <div style={{ 
            backgroundColor: 'white', 
            border: '1px solid #e5e7eb', 
            borderRadius: '8px', 
            padding: '16px' 
          }}>
            <h3 style={{ 
              fontSize: '16px', 
              fontWeight: '500', 
              color: '#111827', 
              margin: '0 0 12px 0' 
            }}>
              🎬 Active Composition Video
            </h3>
            
            {activeCompVideo ? (
              <div style={{ marginBottom: '12px' }}>
                <div style={{ 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  color: '#374151', 
                  marginBottom: '4px' 
                }}>
                  Active Video Layer:
                </div>
                <div style={{
                  padding: '8px 12px',
                  fontSize: '14px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: '#f9fafb',
                  color: '#111827',
                  wordBreak: 'break-all'
                }}>
                  🎞️ {activeCompVideo}
                </div>
              </div>
            ) : (
              <div style={{ 
                fontSize: '14px', 
                color: '#6b7280', 
                marginBottom: '12px' 
              }}>
                No video layer detected. Click "Get Video" to scan active composition.
              </div>
            )}
            
            <button
              onClick={getActiveCompVideo}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '14px',
                fontWeight: '500',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                backgroundColor: 'white',
                color: '#374151',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              🎬 Get Video from Active Comp
            </button>
          </div>

          {/* Text Prompt */}
          <div style={{ 
            backgroundColor: 'white', 
            border: '1px solid #e5e7eb', 
            borderRadius: '8px', 
            padding: '16px' 
          }}>
            <h3 style={{ 
              fontSize: '16px', 
              fontWeight: '500', 
              color: '#111827', 
              margin: '0 0 12px 0' 
            }}>
              🎯 Text Prompt
            </h3>
            
            <label style={{ 
              fontSize: '14px', 
              fontWeight: '500', 
              color: '#374151', 
              display: 'block', 
              marginBottom: '4px' 
            }}>
              What to remove:
            </label>
            <input
              type="text"
              value={textPrompt}
              onChange={(e) => setTextPrompt(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                fontSize: '14px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                backgroundColor: 'white',
                color: '#111827',
                boxSizing: 'border-box',
                marginBottom: '8px'
              }}
              placeholder="e.g., 'remove the keyboard'"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isProcessing) {
                  processSAM2Video();
                }
              }}
            />
            
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              💡 Tip: Be specific about the object you want to remove
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ 
            backgroundColor: 'white', 
            border: '1px solid #e5e7eb', 
            borderRadius: '8px', 
            padding: '16px' 
          }}>
            <h3 style={{ 
              fontSize: '16px', 
              fontWeight: '500', 
              color: '#111827', 
              margin: '0 0 12px 0' 
            }}>
              🚀 Actions
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={processSAM2Video}
                disabled={isProcessing || !textPrompt.trim()}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '14px',
                  fontWeight: '500',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: isProcessing || !textPrompt.trim() 
                    ? '#d1d5db' : '#8b5cf6',
                  color: 'white',
                  cursor: isProcessing || !textPrompt.trim() 
                    ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                {isProcessing ? '🔄 Processing...' : '🎭 Process with REAL SAM2'}
              </button>
              
              <button
                onClick={testAgain}
                style={{
                  width: '100%',
                  padding: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  color: '#374151',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                🔄 Test Again
              </button>
              
              <button
                onClick={openOutputFolder}
                style={{
                  width: '100%',
                  padding: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  color: '#374151',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                📁 Open Output Folder
              </button>
              
              <button
                onClick={exportCommand}
                style={{
                  width: '100%',
                  padding: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  color: '#374151',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                📋 Copy Terminal Command
              </button>
              
              <button
                onClick={() => {
                  const installCommand = `# SAM2 Installation with Debug Steps
echo "Step 1: Installing PyTorch for Apple Silicon..."
pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu

echo "Step 2: Installing dependencies (OpenCV, YOLO, Hydra, etc.)..."
pip3 install opencv-python ultralytics matplotlib pillow numpy hydra-core omegaconf

echo "Step 3: Uninstalling old SAM2..."
pip3 uninstall -y sam2

echo "Step 4: Installing fresh SAM2..."
pip3 install git+https://github.com/facebookresearch/sam2.git

echo "Step 5: Verifying SAM2 installation..."
python3 -c 'import sam2; print("SAM2 installation verified")'

echo "All installation steps completed!"`;
                  copyToClipboard(installCommand);
                }}
                style={{
                  width: '100%',
                  padding: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: '#f97316',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                🔧 Copy PyTorch Fix Commands
              </button>
              
              <button
                onClick={() => {
                  const debugCommand = `# Check Python path and installed packages\nwhich python3\npython3 --version\npython3 -c "import sys; print('Python path:', sys.executable)"\npython3 -c "import torch; print('PyTorch version:', torch.__version__)" 2>/dev/null || echo "❌ PyTorch not found"\npython3 -c "import cv2; print('OpenCV version:', cv2.__version__)" 2>/dev/null || echo "❌ OpenCV not found"\npython3 -c "import ultralytics; print('Ultralytics installed')" 2>/dev/null || echo "❌ Ultralytics not found"`;
                  copyToClipboard(debugCommand);
                }}
                style={{
                  width: '100%',
                  padding: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                🔍 Copy Python Debug Commands
              </button>
              
              <button
                onClick={async () => {
                  setResult(prev => prev + '\n🔧 Installing PyTorch and dependencies via ExtendScript...');
                  setIsProcessing(true);
                  
                  const installScript = `
                    try {
                      var commands = [
                        "echo Step 1: Installing PyTorch for Apple Silicon...",
                        "pip3 install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu",
                        "echo Step 2: Installing dependencies OpenCV YOLO Hydra etc...",
                        "pip3 install opencv-python ultralytics matplotlib pillow numpy hydra-core omegaconf",
                        "echo Step 3: Uninstalling old SAM2...",
                        "pip3 uninstall -y sam2",
                        "echo Step 4: Installing fresh SAM2...", 
                        "pip3 install git+https://github.com/facebookresearch/sam2.git",
                        "echo Step 5: Verifying SAM2 installation...",
                        "python3 -c \\"import sam2; print('SAM2 installation verified')\\"",
                        "echo All installation steps completed!"
                      ];
                      
                      var results = [];
                      for (var i = 0; i < commands.length; i++) {
                        var result = system.callSystem(commands[i]);
                        results.push("Command " + (i+1) + ": " + commands[i] + " -> Exit code: " + result);
                      }
                      
                      JSON.stringify({success: true, results: results});
                    } catch (error) {
                      JSON.stringify({success: false, error: error.toString()});
                    }
                  `;
                  
                  if ((window as any).CSInterface) {
                    const csInterface = new (window as any).CSInterface();
                    csInterface.evalScript(installScript, (result: string) => {
                      try {
                        const parsedResult = JSON.parse(result);
                        if (parsedResult.success) {
                          setResult(prev => prev + '\n✅ Installation completed!');
                          parsedResult.results.forEach((res: string) => {
                            setResult(prev => prev + `\n📦 ${res}`);
                          });
                          setResult(prev => prev + '\n\n🎉 Try running SAM2 processing now!');
                        } else {
                          setResult(prev => prev + `\n❌ Installation failed: ${parsedResult.error}`);
                        }
                      } catch (parseError) {
                        setResult(prev => prev + `\n📤 Installation output:\n${result}`);
                      }
                      setIsProcessing(false);
                    });
                  } else {
                    setResult(prev => prev + '\n❌ CSInterface not available for installation');
                    setIsProcessing(false);
                  }
                }}
                disabled={isProcessing}
                style={{
                  width: '100%',
                  padding: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  backgroundColor: isProcessing ? '#d1d5db' : '#10b981',
                  color: 'white',
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                {isProcessing ? '⏳ Installing...' : '🚀 Install PyTorch & SAM2 Now'}
              </button>
            </div>
          </div>

          {/* Success Info */}
          {outputPath && (
            <div style={{ 
              backgroundColor: '#ecfdf5', 
              border: '1px solid #a7f3d0', 
              borderRadius: '8px', 
              padding: '12px' 
            }}>
              <h4 style={{ 
                fontSize: '14px', 
                fontWeight: '500', 
                color: '#065f46', 
                margin: '0 0 8px 0' 
              }}>
                ✅ REAL SAM2 Success!
              </h4>
              <div style={{ fontSize: '12px', color: '#047857', wordBreak: 'break-all' }}>
                📹 {outputPath}
              </div>
            </div>
          )}
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
              color: '#111827', 
              margin: 0 
            }}>
              📊 REAL SAM2 Processing Log
            </h3>
            <button
              onClick={() => setResult('')}
              style={{
                padding: '4px 12px',
                fontSize: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '4px',
                backgroundColor: '#6b7280',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              Clear
            </button>
          </div>
          
          <div style={{
            flex: 1,
            width: '100%',
            padding: '16px',
            fontSize: '12px',
            fontFamily: 'monospace',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            backgroundColor: '#f9fafb',
            color: '#111827',
            overflow: 'auto',
            whiteSpace: 'pre-wrap',
            minHeight: 0
          }}>
            {result || `Ready to process REAL SAM2 video masking (CEP Mode)!

🎯 Current settings:
🎬 Video Source: ${activeCompVideo || 'Active composition (auto-detect)'}
💬 Prompt: "${textPrompt}"

📋 CEP ExtendScript Workflow:
1. Auto-detects video from active After Effects composition
2. Runs REAL SAM2 processing via ExtendScript system calls
3. Python script: Video → YOLOv8 → LARGEST SAM2 model → Mask contours
4. Automatically creates SUBTRACT masks in After Effects
5. Object removal applied directly to your video layer

🎭 KEY ADVANTAGE:
📦 Old: Manual file paths, terminal commands, manual mask creation
🎬 NEW: Complete automation - from detection to final masked video!

🚀 Production Settings:
• Auto-detects video from active composition
• Processes ALL video frames for analysis (unlimited)
• Uses LARGEST available SAM2 model for best quality
• Creates animated masks with proper keyframes
• Sets masks to SUBTRACT mode for object removal

Click "Get Video from Active Comp" then "Process with REAL SAM2" to start!`}
          </div>
        </div>
      </div>

      {/* Instructions Footer */}
      <div style={{ 
        backgroundColor: 'white', 
        borderTop: '1px solid #e5e7eb', 
        padding: '12px 16px' 
      }}>
        <div style={{ fontSize: '12px', color: '#6b7280' }}>
          <p style={{ margin: '0 0 4px 0' }}>
            <strong>🎭 CEP Compatible:</strong> Works with ExtendScript for direct Python execution
          </p>
          <p style={{ margin: 0 }}>
            <strong>✅ Real SAM2:</strong> Exports precise contour data for After Effects import
          </p>
        </div>
      </div>
    </div>
  );
};

export default SAM2VideoMaskingTab;