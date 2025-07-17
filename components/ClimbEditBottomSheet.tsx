import React, { useState } from 'react';
import { View, TextInput } from 'react-native';
import { makeStyles, Text, Button } from '@rn-vui/themed';
import BottomSheetHeader from './BottomSheetHeader';
import SafeBottomSheet from './SafeBottomSheet';
import { useAppState } from '../stores/AppState';

// Regex for matching text at end of description
const MATCHING_REGEX = /\s*(No Matching|Matching Allowed)[.!]?$/;

interface ClimbEditBottomSheetProps {
  isVisible: boolean;
  onBackdropPress: () => void;
  name: string;
  description: string;
  onSave: (name: string, description: string) => void;
}

export default function ClimbEditBottomSheet({
  isVisible,
  onBackdropPress,
  name,
  description,
  onSave,
}: ClimbEditBottomSheetProps) {
  const styles = useStyles();
  const { climbName, climbDescription, setClimbName, setClimbDescription } =
    useAppState();

  // Use persisted state, fallback to props if persisted state is empty
  const editName = climbName || name;
  const editDescription = climbDescription || description;

  // Helper function to set matching option by replacing text
  const setMatchingOption = (option: 'no_matching' | 'matching_allowed') => {
    let cleanedDesc = editDescription.replace(MATCHING_REGEX, '');
    cleanedDesc = cleanedDesc.replace(/\s*[.!]?\s*$/, '');

    let newDescription;
    const separator = cleanedDesc.trim() ? '. ' : '';

    switch (option) {
      case 'no_matching':
        newDescription = cleanedDesc + separator + 'No Matching.';
        break;
      case 'matching_allowed':
        newDescription = cleanedDesc + separator + 'Matching Allowed.';
        break;
    }
    setClimbDescription(newDescription);
  };

  const handleSave = () => {
    onSave(editName, editDescription);
    onBackdropPress();
  };

  const handleCancel = () => {
    // Reset to original values
    setClimbName(name);
    setClimbDescription(description || 'No Matching.');
    onBackdropPress();
  };

  return (
    <SafeBottomSheet isVisible={isVisible} onBackdropPress={handleCancel}>
      <BottomSheetHeader title="Edit Climb" onClose={handleCancel} />

      <View style={styles.section}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.textInput}
          value={editName}
          onChangeText={setClimbName}
          placeholder="Enter climb name"
          autoFocus
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.textInput, styles.multilineInput]}
          value={editDescription}
          onChangeText={setClimbDescription}
          placeholder="Enter climb description"
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Matching Options</Text>
        <View style={styles.buttonRow}>
          <Button
            title="No Matching"
            onPress={() => setMatchingOption('no_matching')}
            containerStyle={styles.matchingButton}
          />
          <Button
            title="Matching Allowed"
            onPress={() => setMatchingOption('matching_allowed')}
            containerStyle={styles.matchingButton}
          />
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="Cancel"
          type="outline"
          onPress={handleCancel}
          containerStyle={styles.buttonHalf}
        />
        <Button
          title="Save"
          onPress={handleSave}
          containerStyle={styles.buttonHalf}
        />
      </View>
    </SafeBottomSheet>
  );
}

const useStyles = makeStyles(theme => ({
  section: {
    padding: 16,
    backgroundColor: theme.colors.secondarySurface,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: theme.colors.grey1,
  },
  textInput: {
    borderWidth: 1,
    borderColor: theme.colors.grey4,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: theme.colors.grey5,
    color: theme.colors.grey1,
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  matchingButton: {
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: theme.colors.secondarySurface,
  },
  buttonHalf: {
    flex: 1,
  },
}));
