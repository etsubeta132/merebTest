import { Image, ScrollView, StyleSheet, TouchableOpacity, View, Alert } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import AsyncStorage from '@react-native-async-storage/async-storage';


const initialExercises = [
  { name: 'Squat', asset_url: 'https://jyfpzydnxyelsxofxcnz.supabase.co/storage/v1/object/public/exercise_gifs/1080/143513.png', gif_asset_url: 'https://jyfpzydnxyelsxofxcnz.supabase.co/storage/v1/object/public/exercise_gifs/1080/143513.gif', equipment: 'barbell' },
  { name: 'Inclined Bench Press', asset_url: 'https://jyfpzydnxyelsxofxcnz.supabase.co/storage/v1/object/public/exercise_gifs/1080/031413.png', gif_asset_url: 'https://jyfpzydnxyelsxofxcnz.supabase.co/storage/v1/object/public/exercise_gifs/1080/031413.gif', equipment: 'barbell' },
  { name: 'Pull Ups', asset_url: 'https://jyfpzydnxyelsxofxcnz.supabase.co/storage/v1/object/public/exercise_gifs/1080/142913.png', gif_asset_url: 'https://jyfpzydnxyelsxofxcnz.supabase.co/storage/v1/object/public/exercise_gifs/1080/142913.gif', equipment: 'bodyweight' },
  { name: 'Shoulder Press', asset_url: 'https://jyfpzydnxyelsxofxcnz.supabase.co/storage/v1/object/public/exercise_gifs/1080/040513.png', gif_asset_url: 'https://jyfpzydnxyelsxofxcnz.supabase.co/storage/v1/object/public/exercise_gifs/1080/040513.gif', equipment: 'dumbbell' },
  { name: 'Curl Biceps', asset_url: 'https://jyfpzydnxyelsxofxcnz.supabase.co/storage/v1/object/public/exercise_gifs/1080/016513.png', gif_asset_url: 'https://jyfpzydnxyelsxofxcnz.supabase.co/storage/v1/object/public/exercise_gifs/1080/016513.gif', equipment: 'cable' },
  { name: 'Extension Triceps', asset_url: 'https://jyfpzydnxyelsxofxcnz.supabase.co/storage/v1/object/public/exercise_gifs/1080/020013.png', gif_asset_url: 'https://jyfpzydnxyelsxofxcnz.supabase.co/storage/v1/object/public/exercise_gifs/1080/020013.gif', equipment: 'cable' },
];

export default function WorkoutScreen() {
  const [selectedExercise, setSelectedExercise] = useState('Pull Ups');
  const [exercises, setExercises] = useState(initialExercises);
  const [originalExercises, setOriginalExercises] = useState(initialExercises);
  const [completedExercises, setCompletedExercises] = useState(['Squat', 'Inclined Bench Press']);
  const [currentlyPlaying, setCurrentlyPlaying] = useState('Pull Ups');
  const [editMode, setEditMode] = useState(false);
  const [longPressedExercise, setLongPressedExercise] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showGif, setShowGif] = useState(false);

  useEffect(() => {
    const loadExercises = async () => {
      try {
        const storedExercises = await AsyncStorage.getItem('exercises');
        const storedCompleted = await AsyncStorage.getItem('completedExercises');
        if (storedExercises) {
          const parsedExercises = JSON.parse(storedExercises);
          setExercises(parsedExercises);
          setOriginalExercises(parsedExercises);
        }
        if (storedCompleted) {
          const parsedCompleted = JSON.parse(storedCompleted).filter((name: string) => name !== currentlyPlaying);
          setCompletedExercises(parsedCompleted);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadExercises();
  }, [currentlyPlaying]);

  const handleSelectExercise = async (exerciseName: string) => {
    if (longPressedExercise) return; 
    setSelectedExercise(exerciseName);
    setLongPressedExercise(null);

    const selectedIndex = exercises.findIndex((ex) => ex.name === exerciseName);
    const playingIndex = exercises.findIndex((ex) => ex.name === currentlyPlaying);

    if (selectedIndex <= playingIndex) {
      setCurrentlyPlaying(exerciseName);
      const newCompleted = exercises
        .slice(0, selectedIndex)
        .map((ex) => ex.name)
        .filter((name) => !completedExercises.includes(name));
      const updatedCompleted = [...completedExercises, ...newCompleted].filter(
        (name) => name !== exerciseName
      );
      setCompletedExercises(updatedCompleted);
      try {
        await AsyncStorage.setItem('completedExercises', JSON.stringify(updatedCompleted));
      } catch (error) {
        console.error('Error saving completed exercises:', error);
      }
    }
  };

  const handleDeleteExercise = (exerciseName: string) => {
    if (exercises.length <= 1) {
      Alert.alert('Cannot Delete', 'You must keep at least one exercise in the list.');
      setLongPressedExercise(null);
      return;
    }

    const updatedExercises = exercises.filter((ex) => ex.name !== exerciseName);
    setExercises(updatedExercises);

    const updatedCompleted = completedExercises.filter((name) => name !== exerciseName);
    setCompletedExercises(updatedCompleted);

    if (exerciseName === currentlyPlaying) {
      const newPlayingIndex = exercises.findIndex((ex) => ex.name === currentlyPlaying);
      const nextPlayingIndex = newPlayingIndex === updatedExercises.length ? newPlayingIndex - 1 : newPlayingIndex;
      const nextPlaying = updatedExercises[nextPlayingIndex]?.name || updatedExercises[0]?.name;
      setCurrentlyPlaying(nextPlaying || '');
      setSelectedExercise(nextPlaying || '');
    }

    setHasChanges(true);
    setLongPressedExercise(null);
  };

  const onDragEnd = ({ data }: { data: any[] }) => {
    setExercises(data);
    setHasChanges(true);
    setLongPressedExercise(null);
  };

  const handleSaveChanges = async () => {
    setOriginalExercises(exercises);
    setEditMode(false);
    setHasChanges(false);
    try {
      await AsyncStorage.setItem('exercises', JSON.stringify(exercises));
      await AsyncStorage.setItem('completedExercises', JSON.stringify(completedExercises));
    } catch (error) {
      console.error('Error saving exercises:', error);
    }
  };

  const handleDiscardChanges = () => {
    setExercises(originalExercises);
    setEditMode(false);
    setHasChanges(false);
    setLongPressedExercise(null);
  };

  const handleAddExercise = () => {
    const newExercise = {
      name: `New Exercise ${exercises.length + 1}`,
      asset_url: 'https://jyfpzydnxyelsxofxcnz.supabase.co/storage/v1/object/public/exercise_gifs/1080/143513.png',
      gif_asset_url: 'https://jyfpzydnxyelsxofxcnz.supabase.co/storage/v1/object/public/exercise_gifs/1080/143513.gif',
      equipment: 'barbell',
    };
    setExercises([...exercises, newExercise]);
    setHasChanges(true);
  };

  const renderExerciseItem = ({ item, drag, isActive }: { item: any; drag: () => void; isActive: boolean }) => {
    const isSelected = selectedExercise === item.name;
    const isPlaying = currentlyPlaying === item.name;
    const isCompleted = completedExercises.includes(item.name);
    const isLongPressed = longPressedExercise === item.name;

    return (
      <ScaleDecorator>
        <View style={styles.exerciseItemWrapper}>
          {(editMode || isLongPressed) && (
            <TouchableOpacity
              style={styles.deleteIcon}
              onPress={() => handleDeleteExercise(item.name)}
            >
              <Ionicons name="remove" size={24} color="#800000" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => handleSelectExercise(item.name)}
            onLongPress={() => {
              setEditMode(true);
              setLongPressedExercise(item.name);
            }}
            onPressIn={drag}
            delayLongPress={200}
            style={[
              styles.exerciseItem,
              isSelected && styles.selectedExerciseItem,
              isCompleted && !isPlaying && styles.completedExerciseItem,
              isActive && styles.activeExerciseItem,
            ]}
          >
            <Image
              source={{ uri: item.asset_url }}
              style={styles.exerciseIcon}
            />
            {isPlaying && !isLongPressed && (
              <Ionicons name="play-circle" size={20} color="#FFD700" style={styles.playIcon} />
            )}
            {isCompleted && !isPlaying && !isLongPressed && (
              <Ionicons name="checkmark-circle" size={20} color="#FFD700" style={styles.checkmark} />
            )}
          </TouchableOpacity>
        </View>
      </ScaleDecorator>
    );
  };

  const renderEditButton = () => (
    <TouchableOpacity
      style={styles.editButton}
      onPress={() => setEditMode(true)}
    >
      <Ionicons name="pencil" size={24} color="#000000" />
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <TouchableOpacity>
          <Ionicons name="chevron-back" size={24} color="#000000" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Chris' Full Body 1</ThemedText>
        <ThemedView style={styles.timer}>
          <Ionicons name="time-outline" size={20} color="#FFFFFF" />
          <ThemedText style={styles.timerText}>00:28:30</ThemedText>
          <TouchableOpacity>
            <Ionicons name="pause-circle" size={24} color="#FF0000" />
          </TouchableOpacity>
        </ThemedView>
      </ThemedView>

      <ScrollView style={styles.mainContent}>
        {/* Exercise List */}
        <ThemedView style={styles.exerciseListContainer}>
          <DraggableFlatList
            data={exercises}
            renderItem={renderExerciseItem}
            keyExtractor={(item) => item.name}
            horizontal
            onDragEnd={onDragEnd}
            scrollEnabled
            contentContainerStyle={styles.exerciseList}
            showsHorizontalScrollIndicator={false}
            dragItemOverflow={false}
            ListFooterComponent={editMode ? null : renderEditButton}
          />
          {editMode && (
            <TouchableOpacity style={styles.addButton} onPress={handleAddExercise}>
              <Ionicons name="add" size={24} color="#000000" />
            </TouchableOpacity>
          )}
        </ThemedView>

        {/* Main Content */}
        <ThemedView style={styles.content}>
          <ThemedView style={styles.card}>
            <ThemedView style={styles.exerciseHeader}>
              <ThemedText style={styles.exerciseTitle}>{selectedExercise}</ThemedText>
              <TouchableOpacity style={styles.replaceButton}>
                <Ionicons name="refresh" size={16} color="#000000" />
                <ThemedText style={styles.replaceText}>Replace</ThemedText>
              </TouchableOpacity>
            </ThemedView>

            {/* Exercise GIF */}
            {exercises.map((exercise) =>
              exercise.name === selectedExercise && (
                <Image
                  key={exercise.name}
                  source={{ uri: exercise.gif_asset_url }}
                  style={styles.exerciseImage}
                />
              )
            )}
            <TouchableOpacity 
  style={styles.equipmentContainer}
  onPress={() => setShowGif(!showGif)}
>
  <Ionicons
    name={
      exercises.find((e) => e.name === selectedExercise)?.equipment === 'barbell'
        ? 'barbell'
        : exercises.find((e) => e.name === selectedExercise)?.equipment === 'dumbbell'
        ? 'barbell'
        : exercises.find((e) => e.name === selectedExercise)?.equipment === 'cable'
        ? 'pulse'
        : 'person'
    }
    size={16}
    color="#666666"
  />
  <ThemedText style={styles.equipment}>
    {exercises.find((e) => e.name === selectedExercise)?.equipment || 'N/A'}
  </ThemedText>
</TouchableOpacity>

            {/* Action Buttons */}
            <ThemedView style={styles.actionButtons}>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="document-text-outline" size={20} color="#000000" />
                <ThemedText style={styles.actionText}>Instructions</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="flame" size={20} color="#000000" />
                <ThemedText style={styles.actionText}>Warm Up</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="help-circle-outline" size={20} color="#000000" />
                <ThemedText style={styles.actionText}>FAQ</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        </ThemedView>
      </ScrollView>

      {/* Edit Mode Buttons */}
      {editMode && (
        <ThemedView style={styles.editModeButtons}>
          <TouchableOpacity
            style={[styles.discardButton, { backgroundColor: '#FFFFFF' }]}
            onPress={handleDiscardChanges}
          >
            <ThemedText style={styles.discardText}>Discard</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: hasChanges ? '#FFD700' : '#DCDCDC' }]}
            onPress={handleSaveChanges}
            disabled={!hasChanges}
          >
            <ThemedText style={styles.saveText}>Save Changes</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#000000',
  },
  timer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 4,
  },
  timerText: {
    color: '#FFFFFF',
    fontSize: 14,
  },

  timerPlaceholder: {
    width: 80,
  },
  mainContent: {
    flex: 1,
  },
  exerciseListContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  exerciseList: {
    paddingVertical: 4,
  },
  exerciseItemWrapper: {
    position: 'relative',
    alignItems: 'center',
  },
  exerciseItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 80,
    marginHorizontal: 4,
    borderRadius: 40,
    backgroundColor: '#E8ECEF',
    position: 'relative',
  },
  selectedExerciseItem: {
    borderWidth: 2,
    borderColor: '#FFD700',
    backgroundColor: '#E8ECEF',
  },
  completedExerciseItem: {
    backgroundColor: '#E8ECEF',
  },
  activeExerciseItem: {
    backgroundColor: '#CCCCCC',
  },
  exerciseIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  playIcon: {
    position: 'absolute',
    bottom: -5,
    right: -5,
  },
  checkmark: {
    position: 'absolute',
    bottom: -5,
    right: -5,
  },
  deleteIcon: {
    position: 'absolute',
    top: -12,
    zIndex: 1,
  },
  editButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8ECEF',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  addButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8ECEF',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  exerciseTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  replaceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 4,
  },
  replaceText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  exerciseImage: {
    width: '100%',
    height: 200,
    resizeMode: 'contain',
    marginBottom: 12,
  },
  equipmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start', // Changed to align left
    marginBottom: 12,
    backgroundColor: '#e0e0e0', // Grey background
    borderRadius: 20, // Curved edges
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-start', // Ensure container only takes needed width
    // Optional shadow for button effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2, // For Android
  },
  equipment: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 0,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DCDCDC',
    gap: 8,
  },
  actionText: {
    fontSize: 14,
    color: '#000000',
  },
  editModeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  discardButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DCDCDC',
    marginRight: 8,
  },
  discardText: {
    fontSize: 16,
    color: '#000000',
  },
  saveButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  saveText: {
    fontSize: 16,
    color: '#000000',
  },
});