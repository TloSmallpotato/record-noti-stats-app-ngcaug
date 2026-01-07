
import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '@/styles/commonStyles';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Dimensions,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import * as MediaLibrary from 'expo-media-library';

interface RecordedVideo {
  id: string;
  uri: string;
  duration: number;
  createdAt: number;
}

const GRID_ITEM_SIZE = (Dimensions.get('window').width - 48) / 3;
const STORAGE_KEY = '@recorded_videos';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    padding: 20,
    paddingBottom: 10,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
    paddingHorizontal: 20,
  },
  gridContainer: {
    padding: 12,
    paddingBottom: 20,
  },
  videoItem: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE,
    margin: 4,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  deleteButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255, 59, 48, 0.9)',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 120, // Increased padding to clear bottom nav bar
    paddingTop: 20,
    backgroundColor: colors.background,
  },
  recordButton: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 40,
  },
  cameraButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordingButton: {
    backgroundColor: '#ff3b30',
  },
  cameraButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    color: '#fff',
  },
});

export default function RecordScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [videos, setVideos] = useState<RecordedVideo[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    loadVideos();
  }, []);

  const loadVideos = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setVideos(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load videos:', error);
    }
  };

  const saveVideos = async (videos: RecordedVideo[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(videos));
    } catch (error) {
      console.error('Failed to save videos:', error);
    }
  };

  const requestPermissions = async () => {
    const cameraStatus = await requestPermission();
    const mediaStatus = await MediaLibrary.requestPermissionsAsync();
    
    return cameraStatus.granted && mediaStatus.granted;
  };

  const handleRecord = async () => {
    const hasPermissions = await requestPermissions();
    
    if (!hasPermissions) {
      Alert.alert(
        'Permissions Required',
        'Camera and media library permissions are required to record videos.'
      );
      return;
    }

    setShowCamera(true);
  };

  const startRecording = async () => {
    if (cameraRef.current && !isRecording) {
      try {
        setIsRecording(true);
        const video = await cameraRef.current.recordAsync();
        
        if (video) {
          // Save to media library
          const asset = await MediaLibrary.createAssetAsync(video.uri);
          
          const newVideo: RecordedVideo = {
            id: Date.now().toString(),
            uri: asset.uri,
            duration: 0,
            createdAt: Date.now(),
          };

          const updatedVideos = [newVideo, ...videos];
          setVideos(updatedVideos);
          await saveVideos(updatedVideos);
        }
      } catch (error) {
        console.error('Recording failed:', error);
        Alert.alert('Error', 'Failed to record video');
      } finally {
        setIsRecording(false);
        setShowCamera(false);
      }
    }
  };

  const stopRecording = () => {
    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
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
            const updatedVideos = videos.filter((v) => v.id !== videoId);
            setVideos(updatedVideos);
            await saveVideos(updatedVideos);
          },
        },
      ]
    );
  };

  const renderVideoItem = ({ item }: { item: RecordedVideo }) => (
    <View style={styles.videoItem}>
      <Video
        source={{ uri: item.uri }}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        shouldPlay={false}
        isLooping={false}
      />
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteVideo(item.id)}
      >
        <Text style={styles.deleteText}>×</Text>
      </TouchableOpacity>
    </View>
  );

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          mode="video"
          facing="back"
        >
          <View style={styles.cameraControls}>
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={() => setShowCamera(false)}
            >
              <Text style={styles.cameraButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.cameraButton, isRecording && styles.recordingButton]}
              onPress={isRecording ? stopRecording : startRecording}
            >
              <Text style={styles.cameraButtonText}>
                {isRecording ? 'Stop' : 'Record'}
              </Text>
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Record</Text>
      
      {videos.length === 0 ? (
        <Text style={styles.emptyText}>
          No recordings yet. Tap the button below to start!
        </Text>
      ) : (
        <FlatList
          data={videos}
          renderItem={renderVideoItem}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={styles.gridContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.recordButton}
          onPress={handleRecord}
          activeOpacity={0.7}
        >
          <Text style={styles.recordButtonText}>Start Recording</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
