import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

// Returns the picked image URI, or null when the user cancels or denies access.
// Native: camera when permitted and available (falls back to the library, e.g. on simulators); web: file picker.
export async function pickPhoto(): Promise<string | null> {
  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.8, allowsEditing: Platform.OS !== 'web', aspect: [1, 1] };
  try {
    if (Platform.OS !== 'web') {
      const cam = await ImagePicker.requestCameraPermissionsAsync();
      if (cam.granted) {
        try {
          const shot = await ImagePicker.launchCameraAsync(options);
          return shot.canceled ? null : (shot.assets[0]?.uri ?? null);
        } catch {
          // No camera (simulator/emulator) — fall through to the library.
        }
      }
      const lib = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!lib.granted) return null;
    }
    const picked = await ImagePicker.launchImageLibraryAsync(options);
    return picked.canceled ? null : (picked.assets[0]?.uri ?? null);
  } catch {
    return null;
  }
}
