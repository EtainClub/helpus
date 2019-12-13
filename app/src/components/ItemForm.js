import React, {useState} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Input} from 'react-native-elements';

const ItemForm = (props) => {
  // to check the main item
  const [checked, setCheck] = useState(false);
  const [item, setItem] = useState(props.item);
  // id to show at front
  const id = props.id + 1;

  updateItem = (value) => {
    console.log('[ItemForm] value', value);
    setItem(value);
    props.handleStateChange(props.id, value);
  }

  showInputWithPlaceholder = (id) => {
/*
    if (id == 1) {
      return (
        <Input
          placeholder="대표 도움 분야를 입력하세요"
          containerStyle={{ flex: 1 }}
          value={item}
          onChangeText={setItem}
          autoCapitalize="none"
          autoCorrect={false}
        />
      );
    }
*/
    return (
      <Input
        placeholder={props.placeholder}
        containerStyle={{ flex: 1 }}
        value={item}
        onChangeText={updateItem}
        autoCapitalize="none"
        autoCorrect={false}
    />
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.id}>{id}</Text>
      {showInputWithPlaceholder(id)}
{/*      <CheckBox
        checked={checked}
        onPress={() => { checked ? setCheck(false) : setCheck(true) }}
  /> */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'flex-start'
  },
  id: {
    fontSize: 18,
    fontWeight: 'bold',
    alignSelf: 'center',
  }
});

export default ItemForm;