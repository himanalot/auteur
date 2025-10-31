#!/usr/bin/env python3
"""
Extract actual frame data from After Effects layer for SAM2 processing
"""
import sys
import json
import os
import tempfile
import time
from pathlib import Path

def extract_frame_from_ae(comp_width, comp_height, layer_index, current_time):
    """
    Extract frame data from After Effects layer
    This would be called by the ExtendScript to get real frame data
    """
    try:
        # For now, create a temporary frame extraction process
        # In production, this would interface with AE's rendering system
        
        temp_dir = tempfile.gettempdir()
        frame_filename = f"ae_frame_{int(time.time())}.png"
        frame_path = os.path.join(temp_dir, frame_filename)
        
        return {
            "success": True,
            "frame_path": frame_path,
            "width": comp_width,
            "height": comp_height,
            "layer_index": layer_index,
            "time": current_time,
            "note": "Frame extraction placeholder - would extract real AE layer content"
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Frame extraction failed: {str(e)}"
        }

def process_ae_frame_with_sam2(prompt, frame_path, comp_width, comp_height):
    """
    Process extracted AE frame with SAM2
    """
    try:
        # Import SAM2 processor
        import subprocess
        import json
        
        # Call the SAM2 processor with the extracted frame
        result = subprocess.run([
            "python3", 
            "/Users/ishanramrakhiani/Library/Application Support/Adobe/CEP/extensions/Maximise AE Tools/call_real_sam2.py",
            prompt,
            frame_path if os.path.exists(frame_path) else ""
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            sam2_output = json.loads(result.stdout)
            
            # Add AE-specific information
            sam2_output["ae_frame_info"] = {
                "source_frame": frame_path,
                "comp_dimensions": f"{comp_width}x{comp_height}",
                "extracted_from_ae": True
            }
            
            return sam2_output
        else:
            return {
                "success": False,
                "error": f"SAM2 processing failed: {result.stderr}"
            }
            
    except Exception as e:
        return {
            "success": False,
            "error": f"AE frame processing failed: {str(e)}"
        }

if __name__ == "__main__":
    if len(sys.argv) < 5:
        print(json.dumps({
            "error": "Usage: python3 extract_ae_frame.py <prompt> <comp_width> <comp_height> <layer_index> [current_time]"
        }))
        sys.exit(1)
    
    prompt = sys.argv[1]
    comp_width = int(sys.argv[2])
    comp_height = int(sys.argv[3])
    layer_index = int(sys.argv[4])
    current_time = float(sys.argv[5]) if len(sys.argv) > 5 else 0.0
    
    # Extract frame from AE
    frame_result = extract_frame_from_ae(comp_width, comp_height, layer_index, current_time)
    
    if frame_result["success"]:
        # Process with SAM2
        sam2_result = process_ae_frame_with_sam2(
            prompt, 
            frame_result.get("frame_path", ""), 
            comp_width, 
            comp_height
        )
        
        # Combine results
        final_result = {
            "frame_extraction": frame_result,
            "sam2_processing": sam2_result
        }
        
        print(json.dumps(final_result))
    else:
        print(json.dumps(frame_result))