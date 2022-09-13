import React, { useState } from "react";
import { Text, TextInput, View, StyleSheet, TouchableOpacity, ActivityIndicator, PermissionsAndroid } from "react-native"
import { app } from "./FirebaseConfig";
import Toaster from "./Toaster";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { addDoc, collection, query, where, getDocs } from "firebase/firestore";
import { writeFile, readFile } from 'react-native-fs';
import XLSX from 'xlsx';
import Share from "react-native-share"

export default function App() {

	const [rollNo, setRollNo] = useState('')
	const [firstName, setFirstName] = useState('')
	const [lastName, setLastName] = useState('')
	const [marks, setMarks] = useState('')
	const [visibility, setVisibility] = useState(false)
	let fetchedData = []
	let jsonData = JSON.stringify(fetchedData)

	var RNFS = require('react-native-fs');
	var filePath = RNFS.ExternalStorageDirectoryPath + '/sampledata.xlsx';

	const requestStorageWritePermission = async function (purpose) {

		const granted = await PermissionsAndroid.request(
			PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
			{
				title: 'Permission for saving and sharing file',
				message: 'Requirement for saving and sharing data as xlsx',
				buttonNeutral: 'Later',
				buttonNegative: 'Cancel',
				buttonPositive: 'OK',
			}
		);
		if (granted === PermissionsAndroid.RESULTS.GRANTED) {
			console.log("Permission Granted write");

			if (purpose === "save")
				saveData()
			else
				sharedata()

		} else {
			console.log("Permission denied write");
			return
		}
	}

	const addData = async function () {

		setVisibility(true)
		const firestore = initializeFirestore(app, { experimentalAutoDetectLongPolling: true })
		try {
			const data = {
				rollNo: rollNo,
				firstName: firstName,
				lastName: lastName,
				marks: marks
			}
			await addDoc(collection(firestore, "SAMPLE"), data);
			setVisibility(false)
			Toaster("data aadded successfully")
		} catch (e) {
			console.error("Error adding document: ", e);
			setVisibility(false)
			Toaster(e.message)
		}
	}

	const saveData = async function () {

		setVisibility(true)
		const firestore = initializeFirestore(app, { experimentalAutoDetectLongPolling: true })
		const q = query(collection(firestore, "SAMPLE"), where("rollNo", "!=", null));
		const querySnapshot = await getDocs(q);
		querySnapshot.forEach((doc) => {
			fetchedData.push(doc.data());
		});
		jsonData = JSON.stringify(fetchedData);
		console.log(jsonData);
		setVisibility(false)

		var ws = XLSX.utils.json_to_sheet(JSON.parse(jsonData));
		var wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, "Sample sheet");

		const wbout = XLSX.write(wb, { type: 'binary', bookType: "xlsx" });
		
		writeFile(filePath, wbout, 'ascii')
			.then((r) => {
				console.log(filePath)
				Toaster(`Data was fetched and saved as xlsx successfully. Path: ${filePath}`)
			})
			.catch((e) => {
				console.log("failed");
				console.log(e)
				Toaster(e.message)
			});
	}

	const sharedata = async function () {

		readFile(`${filePath}`, 'base64')
			.then((res) => {
				let shareOptionsUrl = {
					title: 'Sample Application',
					message: 'From my application',
					url: 'file://' + filePath,
					subject: 'Exported data from application',
					//url: `data:image/png;base64,${res}`,
					//social: Share.Social.EMAIL,
				};
				console.log(res)
				Share.open(shareOptionsUrl);
			})
			.catch((e) => {
				console.log(e.message)
				Toaster("File does not exist. Please download the file first")
			})
	}

	return (
		<View style={styling.container}>
			<View style={styling.inputContainer}>
				<TextInput autoCorrect={false} placeholder="Roll No" value={rollNo} onChangeText={text => setRollNo(text.trim())} style={styling.input} keyboardType="numeric" />
				<TextInput autoCorrect={false} placeholder="First Name" value={firstName} onChangeText={text => setFirstName(text.trim())} style={styling.input} />
				<TextInput autoCorrect={false} placeholder="Last Name" value={lastName} onChangeText={text => setLastName(text.trim())} style={styling.input} />
				<TextInput autoCorrect={false} placeholder="Marks" value={marks} onChangeText={text => setMarks(text.trim())} style={styling.input} keyboardType="numeric" />
			</View>

			<View style={styling.buttonContainer}>
				<TouchableOpacity style={styling.button} onPress={() => { addData() }}>
					<Text style={styling.buttonText}>Add data</Text>
				</TouchableOpacity>
				<TouchableOpacity style={styling.button2} onPress={() => { requestStorageWritePermission("save") }}>
					<Text style={styling.buttonText}>Download data as xlsx</Text>
				</TouchableOpacity>
				<TouchableOpacity onPress={() => { requestStorageWritePermission("share") }}>
					<Text style={styling.buttonText2}>Share data</Text>
				</TouchableOpacity>

			</View>
			{visibility ? <ActivityIndicator style={styling.pBar} size="large" /> : null}
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
		width: '80%'
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
		marginTop: 10
	},
	button2: {
		backgroundColor: '#0782F9',
		width: '80%',
		padding: 10,
		borderRadius: 20,
		alignItems: 'center',
		marginTop: 10
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
		fontSize: 16
	},
	buttonText2: {
		color: 'blue',
		fontWeight: '700',
		fontSize: 16,
		marginTop: 20
	},
	buttonOutlineText: {
		color: '#0782F9',
		fontWeight: '700',
		fontSize: 16,
	},
	pBar: {
		borderColor: "black",
		position: "absolute",
		top: 600
	}
});
