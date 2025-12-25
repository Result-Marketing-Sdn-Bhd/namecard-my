import * as ImageManipulator from 'expo-image-manipulator';
import { Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface CropResult {
  uri: string;
  width: number;
  height: number;
}

/**
 * Auto-crop business card from image
 * This function crops exactly to the frame boundaries shown on camera screen
 */
export async function autoCropBusinessCard(imageUri: string): Promise<CropResult> {
  try {
    console.log('🔄 Starting auto-crop process...');

    // Get the full captured image
    const capturedImage = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: 2000 } }], // Normalize size first
      {
        format: ImageManipulator.SaveFormat.JPEG,
        compress: 0.9
      }
    );

    console.log(`📐 Captured image dimensions: ${capturedImage.width}x${capturedImage.height}`);

    // Frame dimensions on screen (matching CameraScreen.tsx)
    // The frame is 80% of screen width and 60% of that width for height
    const FRAME_WIDTH_RATIO = 0.8;
    const FRAME_HEIGHT_RATIO = 0.6;

    // Calculate crop dimensions to extract ONLY the rectangle frame area
    const horizontalMargin = (1 - FRAME_WIDTH_RATIO) / 2;
    const cropWidth = capturedImage.width * FRAME_WIDTH_RATIO;
    const cropHeight = cropWidth * FRAME_HEIGHT_RATIO;
    const cropX = capturedImage.width * horizontalMargin;
    const cropY = (capturedImage.height - cropHeight) / 2; // Center vertically

    console.log(`✂️ Cropping to frame area: x=${Math.round(cropX)}, y=${Math.round(cropY)}, w=${Math.round(cropWidth)}, h=${Math.round(cropHeight)}`);

    // STEP 1: Crop to exactly the rectangle frame area
    const croppedToFrame = await ImageManipulator.manipulateAsync(
      capturedImage.uri,
      [
        {
          crop: {
            originX: Math.max(0, Math.round(cropX)),
            originY: Math.max(0, Math.round(cropY)),
            width: Math.min(Math.round(cropWidth), capturedImage.width),
            height: Math.min(Math.round(cropHeight), capturedImage.height),
          },
        },
      ],
      {
        compress: 0.9,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    console.log(`✂️ Cropped to frame: ${croppedToFrame.width}x${croppedToFrame.height}`);

    // STEP 2: If the cropped business card is portrait (taller than wide), rotate to landscape
    let finalImage = croppedToFrame;
    if (croppedToFrame.height > croppedToFrame.width) {
      console.log('🔄 Business card is portrait, rotating to landscape...');
      finalImage = await ImageManipulator.manipulateAsync(
        croppedToFrame.uri,
        [
          { rotate: 90 }, // Rotate 90 degrees clockwise to landscape
          { resize: { width: 1200 } }, // Resize for optimal OCR
        ],
        {
          format: ImageManipulator.SaveFormat.JPEG,
          compress: 0.9
        }
      );
      console.log(`✅ Rotated to landscape: ${finalImage.width}x${finalImage.height}`);
    } else {
      console.log('✅ Business card already in landscape orientation');
      // Just resize for OCR
      finalImage = await ImageManipulator.manipulateAsync(
        croppedToFrame.uri,
        [{ resize: { width: 1200 } }],
        {
          format: ImageManipulator.SaveFormat.JPEG,
          compress: 0.9
        }
      );
    }

    console.log(`✅ Auto-crop completed: ${finalImage.width}x${finalImage.height}`);

    return {
      uri: finalImage.uri,
      width: finalImage.width,
      height: finalImage.height,
    };
  } catch (error) {
    console.error('❌ Auto-crop failed:', error);
    // If crop fails, return original image
    return {
      uri: imageUri,
      width: 0,
      height: 0,
    };
  }
}
