
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Platform,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { Video, ResizeMode } from 'expo-av';
import { colors } from '@/styles/commonStyles';
import { IconSymbol } from '@/components/IconSymbol';

const { width } = Dimensions.get('window');
const GRID_ITEM_SIZE = (width - 60) / 3; // 3 columns with padding

interface RecordedVideo {
  id: string;
  uri: string;
  duration: number;
  createdAt: number;
}

export default function RecordScreen() {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [mediaLibraryPermission, requestMediaLibraryPermission] = MediaLibrary.usePermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [videos, setVideos] = useState<RecordedVideo[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      setIsLoading(true);
      
      // Fetch recorded videos from the backend API
      const { apiGet, BACKEND_URL } = await import('@/utils/api');
      
      console.log('[Record] Loading videos from backend:', BACKEND_URL);
      
      const response = await apiGet<{
        data: Array<{
          id: string;
          video_url: string;
          thumbnail_url?: string;
          duration: number;
          created_at: string;
          file_size: number;
        }>;
        total: number;
        page: number;
        limit: number;
      }>('/recordings?page=1&limit=100');
      
      console.log('[Record] Loaded videos:', response.data.length);
      
      // Convert backend format to local format
      const loadedVideos: RecordedVideo[] = response.data.map((video) => ({
        id: video.id,
        uri: video.video_url,
        duration: video.duration,
        createdAt: new Date(video.created_at).getTime(),
      }));
      
      setVideos(loadedVideos);
    } catch (error) {
      console.error('[Record] Error loading videos:', error);
      Alert.alert('Error', 'Failed to load videos from backend');
      // Fallback to empty array on error
      setVideos([]);
    } finally {
      setIsLoading(false);
    }
  };

  const requestPermissions = async () => {
    try {
      const cameraResult = await requestCameraPermission();
      const mediaResult = await requestMediaLibraryPermission();

      if (!cameraResult.granted || !mediaResult.granted) {
        Alert.alert(
          'Permissions Required',
          'Camera and media library permissions are required to record videos.'
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error requesting permissions:', error);
      return false;
    }
  };

  const handleRecord = async () => {
    try {
      // Check permissions
      if (!cameraPermission?.granted || !mediaLibraryPermission?.granted) {
        const granted = await requestPermissions();
        if (!granted) return;
      }

      if (isRecording) {
        // Stop recording
        console.log('Stopping recording...');
        if (cameraRef.current) {
          cameraRef.current.stopRecording();
        }
        setIsRecording(false);
      } else {
        // Start recording
        console.log('Starting recording...');
        setIsRecording(true);

        if (cameraRef.current) {
          const video = await cameraRef.current.recordAsync({
            maxDuration: 60, // 60 seconds max
          });

          if (video && video.uri) {
            console.log('Video recorded:', video.uri);

            // Save to media library
            const asset = await MediaLibrary.createAssetAsync(video.uri);
            console.log('Video saved to media library:', asset.uri);

            // Add to local state
            const newVideo: RecordedVideo = {
              id: asset.id,
              uri: asset.uri,
              duration: 0, // Duration not available from asset
              createdAt: Date.now(),
            };

            setVideos((prev) => [newVideo, ...prev]);

            // Upload video to backend API
            try {
              setIsUploading(true);
              const { apiPost, BACKEND_URL } = await import('@/utils/api');
              
              console.log('[Record] Uploading video to backend:', BACKEND_URL);
              
              // Create FormData for multipart upload
              const formData = new FormData();
              
              // For React Native, we need to append the file with proper format
              const fileUri = Platform.OS === 'ios' ? asset.uri.replace('file://', '') : asset.uri;
              const fileName = `video_${Date.now()}.mov`;
              
              // @ts-ignore - FormData append accepts file objects in React Native
              formData.append('video', {
                uri: fileUri,
                type: 'video/quicktime',
                name: fileName,
              });
              
              // Use fetch directly for multipart/form-data
              const uploadResponse = await fetch(`${BACKEND_URL}/recordings/upload`, {
                method: 'POST',
                body: formData,
                headers: {
                  'Accept': 'application/json',
                  // Don't set Content-Type - let the browser/RN set it with boundary
                },
              });
              
              if (!uploadResponse.ok) {
                const errorText = await uploadResponse.text();
                console.error('[Record] Upload failed:', uploadResponse.status, errorText);
                throw new Error(`Upload failed: ${uploadResponse.status}`);
              }
              
              const uploadedVideo = await uploadResponse.json();
              console.log('[Record] Video uploaded successfully:', uploadedVideo.id);
              
              // Update the video with backend ID
              setVideos((prev) => 
                prev.map((v) => 
                  v.id === newVideo.id 
                    ? { ...v, id: uploadedVideo.id, uri: uploadedVideo.video_url }
                    : v
                )
              );
              
              Alert.alert('Success', 'Video recorded, saved, and uploaded to backend!');
            } catch (uploadError) {
              console.error('[Record] Error uploading video:', uploadError);
              Alert.alert('Warning', 'Video saved locally but failed to upload to backend');
            } finally {
              setIsUploading(false);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error recording video:', error);
      setIsRecording(false);
      Alert.alert('Error', 'Failed to record video');
    }
  };

  const handleDeleteVideo = (videoId: string) => {
    Alert.alert(
      'Delete Video',
      'Are you sure you want to delete this video?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete from media library
              await MediaLibrary.deleteAssetsAsync([videoId]);

              // Remove from local state
              setVideos((prev) => prev.filter((v) => v.id !== videoId));

              // Delete video from backend API
              try {
                const { apiDelete, BACKEND_URL } = await import('@/utils/api');
                
                console.log('[Record] Deleting video from backend:', videoId);
                
                const deleteResponse = await apiDelete<{
                  success: boolean;
                  message: string;
                }>(`/recordings/${videoId}`);
                
                console.log('[Record] Video deleted from backend:', deleteResponse.message);
              } catch (deleteError) {
                console.error('[Record] Error deleting from backend:', deleteError);
                // Video already removed from local state, so just log the error
              }
            } catch (error) {
              console.error('Error deleting video:', error);
              Alert.alert('Error', 'Failed to delete video');
            }
          },
        },
      ]
    );
  };

  const renderVideoItem = ({ item }: { item: RecordedVideo }) => (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={() => setSelectedVideo(item.uri)}
      onLongPress={() => handleDeleteVideo(item.id)}
    >
      <Video
        source={{ uri: item.uri }}
        style={styles.videoThumbnail}
        resizeMode={ResizeMode.COVER}
        shouldPlay={false}
        isLooping={false}
      />
      <View style={styles.playIconContainer}>
        <IconSymbol
          ios_icon_name="play.fill"
          android_material_icon_name="play-arrow"
          size={32}
          color="#FFFFFF"
        />
      </View>
    </TouchableOpacity>
  );

  // Show permission request screen if needed
  if (!cameraPermission || !mediaLibraryPermission) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.permissionContainer}>
          <Text style={styles.title}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!cameraPermission.granted || !mediaLibraryPermission.granted) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.permissionContainer}>
          <Text style={styles.title}>Permissions Required</Text>
          <Text style={styles.permissionText}>
            Camera and media library access are required to record videos.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermissions}>
            <Text style={styles.buttonText}>Grant Permissions</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <Text style={styles.title}>Video Recorder</Text>
        <Text style={styles.subtitle}>{videos.length} videos recorded</Text>

        {/* Video Grid */}
        <View style={styles.gridContainer}>
          {isLoading ? (
            <View style={styles.emptyState}>
              <IconSymbol
                ios_icon_name="arrow.clockwise"
                android_material_icon_name="refresh"
                size={64}
                color={colors.primary}
              />
              <Text style={styles.emptyText}>Loading videos...</Text>
            </View>
          ) : videos.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol
                ios_icon_name="video.fill"
                android_material_icon_name="videocam"
                size={64}
                color={colors.textSecondary}
              />
              <Text style={styles.emptyText}>No videos yet</Text>
              <Text style={styles.emptySubtext}>Tap the record button to start</Text>
            </View>
          ) : (
            <FlatList
              data={videos}
              renderItem={renderVideoItem}
              keyExtractor={(item) => item.id}
              numColumns={3}
              contentContainerStyle={styles.gridContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        {/* Upload indicator */}
        {isUploading && (
          <View style={styles.uploadingIndicator}>
            <IconSymbol
              ios_icon_name="arrow.up.circle.fill"
              android_material_icon_name="cloud-upload"
              size={24}
              color="#FFFFFF"
            />
            <Text style={styles.uploadingText}>Uploading to backend...</Text>
          </View>
        )}

        {/* Record Button */}
        <View style={styles.recordButtonContainer}>
          <TouchableOpacity
            style={[
              styles.recordButton,
              isRecording && styles.recordButtonActive,
            ]}
            onPress={handleRecord}
          >
            <View style={[
              styles.recordButtonInner,
              isRecording && styles.recordButtonInnerActive,
            ]} />
          </TouchableOpacity>
          <Text style={styles.recordButtonText}>
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </Text>
        </View>
      </View>

      {/* Hidden Camera View for recording */}
      {cameraPermission.granted && (
        <View style={styles.hiddenCamera}>
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing="back"
            mode="video"
          />
        </View>
      )}

      {/* Video Player Modal */}
      {selectedVideo && (
        <View style={styles.videoPlayerModal}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setSelectedVideo(null)}
          >
            <IconSymbol
              ios_icon_name="xmark"
              android_material_icon_name="close"
              size={32}
              color="#FFFFFF"
            />
          </TouchableOpacity>
          <Video
            source={{ uri: selectedVideo }}
            style={styles.videoPlayer}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay
            isLooping
            useNativeControls
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingBottom: 100, // Space for tab bar
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  gridContainer: {
    flex: 1,
    marginBottom: 20,
  },
  gridContent: {
    gap: 8,
  },
  gridItem: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE,
    margin: 4,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.card,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    elevation: 2,
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
  },
  playIconContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  recordButtonContainer: {
    alignItems: 'center',
    gap: 12,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: colors.primary,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.2)',
    elevation: 4,
  },
  recordButtonActive: {
    borderColor: colors.highlight,
  },
  recordButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
  },
  recordButtonInnerActive: {
    width: 30,
    height: 30,
    borderRadius: 4,
    backgroundColor: colors.highlight,
  },
  recordButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  hiddenCamera: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  videoPlayerModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  videoPlayer: {
    width: '100%',
    height: '80%',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 1001,
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 24,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
    elevation: 4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  uploadingIndicator: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.2)',
    elevation: 4,
    zIndex: 100,
  },
  uploadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
