
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Dimensions,
} from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { colors } from '@/styles/commonStyles';
import { Video, ResizeMode } from 'expo-av';
import * as MediaLibrary from 'expo-media-library';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface RecordedVideo {
  id: string;
  uri: string;
  duration: number;
  createdAt: number;
}

const GRID_ITEM_SIZE = (Dimensions.get('window').width - 48) / 3;
const STORAGE_KEY = '@recordings';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
  },
  grid: {
    flex: 1,
  },
  gridItem: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE,
    margin: 4,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.cardBackground,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  deleteButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  recordButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 40,
    paddingVertical: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  recordButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
  camera: {
    flex: 1,
  },
  cameraContainer: {
    flex: 1,
  },
  cameraControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  stopButton: {
    backgroundColor: 'red',
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default function RecordScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [recordings, setRecordings] = useState<RecordedVideo[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    loadVideos();
    requestPermissions();
  }, []);

  const loadVideos = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setRecordings(JSON.parse(stored));
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
    await requestPermission();
    await MediaLibrary.requestPermissionsAsync();
  };

  const handleRecord = async () => {
    if (!permission?.granted) {
      await requestPermissions();
      return;
    }

    if (isRecording) {
      // Stop recording
      if (cameraRef.current) {
        try {
          const video = await cameraRef.current.stopRecording();
          if (video) {
            const newRecording: RecordedVideo = {
              id: Date.now().toString(),
              uri: video.uri,
              duration: 0,
              createdAt: Date.now(),
            };
            const updated = [newRecording, ...recordings];
            setRecordings(updated);
            await saveVideos(updated);
          }
        } catch (error) {
          console.error('Failed to stop recording:', error);
        }
      }
      setIsRecording(false);
    } else {
      // Start recording
      setIsRecording(true);
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
            const updated = recordings.filter((v) => v.id !== videoId);
            setRecordings(updated);
            await saveVideos(updated);
          },
        },
      ]
    );
  };

  const renderVideoItem = ({ item }: { item: RecordedVideo }) => (
    <View style={styles.gridItem}>
      <Video
        source={{ uri: item.uri }}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        shouldPlay={false}
        useNativeControls
      />
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteVideo(item.id)}
      >
        <Text style={styles.deleteText}>×</Text>
      </TouchableOpacity>
    </View>
  );

  if (isRecording) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          mode="video"
          onCameraReady={() => {
            cameraRef.current?.recordAsync();
          }}
        />
        <View style={styles.cameraControls}>
          <TouchableOpacity style={styles.stopButton} onPress={handleRecord}>
            <Text style={{ color: '#fff', fontSize: 16 }}>STOP</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <Text style={styles.title}>Record</Text>
        
        <FlatList
          data={recordings}
          renderItem={renderVideoItem}
          keyExtractor={(item) => item.id}
          numColumns={3}
          style={styles.grid}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No recordings yet. Tap the button below to start!</Text>
          }
        />

        <TouchableOpacity style={styles.recordButton} onPress={handleRecord}>
          <Text style={styles.recordButtonText}>
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
