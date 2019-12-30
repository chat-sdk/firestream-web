# Firefly Web

## Initializing Firefly with Firebase App
```js
import * as firebase from 'firebase/app'
import 'firebase/auth'
import { Fl } from 'firefly'

const app = firebase.initializeApp({ /* firebaseConfig */ })

Fl.y.initialize(app)
```
