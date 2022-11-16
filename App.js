import React, {useEffect, useState} from 'react';
import {
  Text,
  TextInput,
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  PermissionsAndroid,
} from 'react-native';
import Toaster from './Toaster';
import {writeFile, readFile} from 'react-native-fs';
import XLSX from 'xlsx';
import Share from 'react-native-share';
import SQLite from 'react-native-sqlite-storage';

export default function App() {
  const [rollNo, setRollNo] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [marks, setMarks] = useState('');
  const [visibility, setVisibility] = useState(false);
  let fetchedData = [];

  useEffect(() => {
    requestStorageWritePermission();
  }, []);

  var RNFS = require('react-native-fs');
  var filePath = RNFS.DownloadDirectoryPath + '/sampledata.xlsx';

  const requestStorageWritePermission = async function () {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      {
        title: 'Permission for saving and sharing file',
        message: 'Requirement for saving and sharing data as xlsx',
        buttonNeutral: 'Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      },
    );
    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      console.log('Permission to write Granted');
    } else {
      console.log('Permission to write Denied');
      return;
    }
  };

  const db = SQLite.openDatabase(
    {name: 'TestDB', location: 'default'},
    () => {},
    error => console.log(error),
  );

  const createTable = async function () {
    await db.transaction(tx => {
      tx.executeSql(
        'CREATE TABLE IF NOT EXISTS USERS (ID INTEGER PRIMARY KEY AUTOINCREMENT, Rno INTEGER, FName TEXT, LName TEXT, Marks INTEGER)',
      );
    });
  };

  const insertData = async function () {
    await createTable();
    await db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO USERS (Rno, Fname, Lname, Marks) VALUES (?,?,?,?)',
        [rollNo, firstName, lastName, marks],
        (tx, result) => {
          if (result.rowsAffected == 1) {
            console.log('Record has been inserted successfully !!');
          }
        },
      );
    });
  };

  const getData = async function () {
    await db.transaction(tx => {
      tx.executeSql('SELECT * from USERS', [], (tx, result) => {
        let length = result.rows.length - 1;
        let serialNo = 0;
        while (length >= 0) {
          serialNo++;
          fetchedData.push({
            slNo: serialNo,
            Roll_No: result.rows.item(length).Rno,
            First_Name: result.rows.item(length).FName,
            Last_Name: result.rows.item(length).LName,
            Marks: result.rows.item(length).Marks,
          });
          length--;
        }
        console.log("Records has been fetched successfully...Saving it as xlsx");
        saveData();
      });
    });
  };

  const saveData = async function () {
    setVisibility(true);
    var ws = XLSX.utils.json_to_sheet(fetchedData);
    var wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sample sheet');

    const wbout = XLSX.write(wb, {type: 'binary', bookType: 'xlsx'});

    await writeFile(filePath, wbout, 'ascii')
      .then(r => {
        console.log(filePath);
        Toaster(
          `Data was fetched and saved as xlsx successfully. Path: ${filePath}`,
        );
      })
      .catch(e => {
        console.log('Failed to save data as xlsx');
        console.log(e);
        Toaster(e.message);
      });
    setVisibility(false);
  };

  const shareData = async function () {
    readFile(`${filePath}`, 'base64')
      .then(res => {
        let shareOptionsUrl = {
          title: 'Sample Application',
          message: 'From my application',
          url: 'file://' + filePath,
          subject: 'Exported data from application',
          //url: `data:image/png;base64,${res}`,
          //social: Share.Social.EMAIL,
        };
        Share.open(shareOptionsUrl)
          .then(() => console.log('success'))
          .catch(error => {
            if (!error.message.includes('did not share')) {
              console.log(error.message);
              return;
            }
            console.log('Verify if the file has been shared successfully');
          });
      })
      .catch(e => {
        console.log(e.message);
        Toaster('File does not exist. Please download the file first');
      });
  };

  return (
    <View style={styling.container}>
      <View style={styling.inputContainer}>
        <TextInput
          autoCorrect={false}
          placeholder="Roll No"
          value={rollNo}
          onChangeText={text => setRollNo(text.trim())}
          style={styling.input}
          keyboardType="numeric"
        />
        <TextInput
          autoCorrect={false}
          placeholder="First Name"
          value={firstName}
          onChangeText={text => setFirstName(text.trim())}
          style={styling.input}
        />
        <TextInput
          autoCorrect={false}
          placeholder="Last Name"
          value={lastName}
          onChangeText={text => setLastName(text.trim())}
          style={styling.input}
        />
        <TextInput
          autoCorrect={false}
          placeholder="Marks"
          value={marks}
          onChangeText={text => setMarks(text.trim())}
          style={styling.input}
          keyboardType="numeric"
        />
      </View>

      <View style={styling.buttonContainer}>
        <TouchableOpacity
          style={styling.button}
          onPress={async () => {
            await insertData();
          }}>
          <Text style={styling.buttonText}>Insert data</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styling.button2}
          onPress={() => {
            getData();
          }}>
          <Text style={styling.buttonText}>Save data as xlsx</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            shareData();
          }}>
          <Text style={styling.buttonText2}>Share data</Text>
        </TouchableOpacity>
      </View>
      {visibility ? (
        <ActivityIndicator style={styling.pBar} size="large" />
      ) : null}
    </View>
  );
}

const styling = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    width: '80%',
  },
  input: {
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 5,
  },
  buttonContainer: {
    width: '60%',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  button: {
    backgroundColor: '#0782F9',
    width: '50%',
    padding: 10,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 10,
  },
  button2: {
    backgroundColor: '#0782F9',
    width: '80%',
    padding: 10,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonOutline: {
    backgroundColor: 'white',
    marginTop: 5,
    borderColor: '#0782F9',
    borderWidth: 2,
  },
  buttonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  buttonText2: {
    color: 'blue',
    fontWeight: '700',
    fontSize: 16,
    marginTop: 20,
  },
  buttonOutlineText: {
    color: '#0782F9',
    fontWeight: '700',
    fontSize: 16,
  },
  pBar: {
    borderColor: 'black',
    position: 'absolute',
    top: 600,
  },
});
