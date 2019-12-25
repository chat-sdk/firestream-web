# Fireflyy Web

## Initializing Fireflyy with Firebase App
```js
import * as firebase from 'firebase/app'
import 'firebase/auth'
import { Fly } from 'fireflyy'

const app = firebase.initializeApp({ /* firebaseConfig */ })

Fly.y.initialize(app)
```
