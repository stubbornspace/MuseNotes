import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ImageBackground, Dimensions, KeyboardAvoidingView, Platform, Keyboard, TouchableOpacity, TextInput } from 'react-native';
import { useNotes } from '../context/NotesContext';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Note } from '../types/note';
import { createGlobalStyles } from '../styles/globalStyles';
import { SaveNoteModal } from '../components/SaveNoteModal';
import { MenuButton } from '../components/MenuButton';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useBackground } from '../context/BackgroundContext';
import { useFontSize } from '../context/FontSizeContext';
import { useAudio } from '../context/AudioContext';
import * as Clipboard from 'expo-clipboard';

type RootStackParamList = {
  Tags: undefined;
  Editor: { noteId?: string };
  Settings: undefined;
  Index: undefined;
  TagManagement: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type EditorScreenRouteProp = RouteProp<RootStackParamList, 'Editor'>;
type IconName = keyof typeof Ionicons.glyphMap;

export const EditorScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<EditorScreenRouteProp>();
  const noteId = route.params?.noteId;
  const { notes, addNote, updateNote, deleteNote } = useNotes();
  const { backgroundImage } = useBackground();
  const { fontSize } = useFontSize();
  const { isPlaying, togglePlayback } = useAudio();
  const globalStyles = createGlobalStyles(fontSize);

  const [content, setContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaveModalVisible, setIsSaveModalVisible] = useState(false);
  const [currentNote, setCurrentNote] = useState<Note | null>(null);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    Dimensions.get('window').width < Dimensions.get('window').height ? 'portrait' : 'landscape'
  );
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (noteId) {
      const note = notes.find(n => n.id === noteId);
      if (note) {
        setContent(note.content || '');
        setCurrentNote(note);
        setIsEditing(true);
      }
    }
  }, [noteId, notes]);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setOrientation(window.width < window.height ? 'portrait' : 'landscape');
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  const handleTextChange = (text: string) => {
    setContent(text);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSave = (title: string, tag: string) => {
    if (isEditing && noteId) {
      updateNote(noteId, { title, content, tag });
    } else {
      addNote({ title, content, tag });
    }
    setIsSaveModalVisible(false);
    navigation.goBack();
  };

  const handleDelete = () => {
    if (noteId) {
      deleteNote(noteId);
      navigation.goBack();
    }
  };

  const handleCopy = async () => {
    try {
      await Clipboard.setString(content);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Error copying text:', error);
    }
  };

  const menuActions = [
    {
      label: 'Save',
      onPress: () => setIsSaveModalVisible(true),
      icon: 'save-outline' as IconName,
    },
    {
      label: 'Delete',
      onPress: handleDelete,
      icon: 'trash-outline' as IconName,
    },
    {
      label: 'Copy All',
      onPress: handleCopy,
      icon: 'copy-outline' as IconName,
    },
    {
      label: 'Manage Tags',
      onPress: () => navigation.navigate('TagManagement'),
      icon: 'pricetags-outline' as IconName,
    },
    {
      label: 'Home',
      onPress: () => navigation.navigate('Tags'),
      icon: 'home-outline' as IconName,
    },
    {
      label: 'Audio',
      onPress: togglePlayback,
      icon: isPlaying ? 'pause-circle-outline' : 'play-circle-outline' as IconName,
    },
    {
      label: 'Settings',
      onPress: () => navigation.navigate('Settings'),
      icon: 'settings-outline' as IconName,
    },
  ];

  return (
    <ImageBackground
      source={backgroundImage}
      style={globalStyles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <TouchableOpacity 
          style={globalStyles.backButton}
          onPress={() => navigation.goBack()}
        >
          <View style={globalStyles.backButtonCircle}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        <MenuButton actions={menuActions} />

        <View style={styles.editorWrapper}>
          <View style={[
            styles.editorContainer,
            { maxHeight: orientation === 'portrait' ? 600 - keyboardHeight : 900 - keyboardHeight },
            { maxWidth: orientation === 'portrait' ? 960 : 800 }
          ]}>
            <TextInput
              style={[
                styles.textInput,
                { fontSize: fontSize + 2 }
              ]}
              value={content}
              onChangeText={handleTextChange}
              placeholder="Start writing..."
              placeholderTextColor="#666666"
              multiline
              autoCorrect
              spellCheck
              autoCapitalize="sentences"
              textAlignVertical="top"
            />
          </View>
        </View>
      </KeyboardAvoidingView>

      <SaveNoteModal
        visible={isSaveModalVisible}
        onSave={handleSave}
        onCancel={() => setIsSaveModalVisible(false)}
        initialTitle={currentNote?.title}
        initialTag={currentNote?.tag}
      />
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  editorWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',    
    marginTop: 100,
  },
  editorContainer: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: 'transparent',
    paddingLeft: 20,
    paddingRight: 20,
    borderRadius: 1,
  },
  textInput: {
    flex: 1,
    color: '#FFFFFF',
    backgroundColor: 'transparent',
    padding: 10,
    textAlign: 'left',
  }
}); 