import { initializeApp, getApps, getApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyA6Fz43CA-wGR1bZwhL7pZPlAUvmZzdgJc",
  authDomain: "poc-react-native-87b76.firebaseapp.com",
  projectId: "poc-react-native-87b76",
  storageBucket: "poc-react-native-87b76.appspot.com",
  messagingSenderId: "947932008265",
  appId: "1:947932008265:web:9c6a2dab68c3bba9691498",
  measurementId: "G-V2HVEYD8GQ"
};

// Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp()
}

export {app}
