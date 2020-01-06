# FireStream JS

## Initializing FireStream with Firebase App
```js
import * as firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/firestore'
import { Fire } from 'firestream'

const app = firebase.initializeApp({ /* firebaseConfig */ })

Fire.Stream.initialize(app)
```
