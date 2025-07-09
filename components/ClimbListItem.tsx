import React from 'react';
import { TouchableHighlight } from 'react-native';
import { ListItem } from '@rneui/themed';
import { DbClimb } from '../Database';
import { match, P } from 'ts-pattern';

type Props = {
  item: DbClimb;
  onPress: () => void;
};

export default function ClimbListItem({ item, onPress }: Props) {
  let subtitle = match(item)
    .with({ fa_username: null }, () => `Set: ${item.setter_username}`)
    .with(
      { fa_username: P.string, setter_username: P.string },
      ({ fa_username, setter_username }) =>
        fa_username === setter_username
          ? `Set & FA: ${item.setter_username}`
          : `Set: ${item.setter_username} FA: ${item.setter_username}`,
    )
    .otherwise(() => null);

  return (
    <ListItem
      bottomDivider
      Component={TouchableHighlight}
      onPress={onPress}
    >
      <ListItem.Content>
        <ListItem.Title>{item.name}</ListItem.Title>
        {subtitle && <ListItem.Subtitle>{subtitle}</ListItem.Subtitle>}
        <ListItem.Subtitle>
          {item.ascensionist_count} ascensionists
        </ListItem.Subtitle>
      </ListItem.Content>
      <ListItem.Chevron />
    </ListItem>
  );
}