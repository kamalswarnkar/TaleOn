# 🧪 **TaleOn API Testing Guide - Postman**

## **🚀 Setup Postman**

### **1. Import Environment Variables**
Create a new environment in Postman with these variables:
```
BASE_URL: http://localhost:5000
TOKEN: (leave empty - will be filled after login)
USER_ID: (leave empty - will be filled after login)
ROOM_CODE: (leave empty - will be filled after room creation)
```

### **2. Create a Collection**
Name it: `TaleOn API Tests`

---

## **🔐 Authentication Tests**

### **1. User Signup**
```
POST {{BASE_URL}}/auth/signup
Content-Type: application/json

Body:
{
  "username": "testuser1",
  "email": "test1@example.com",
  "password": "password123"
}
```

**Tests Tab:**
```javascript
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});

pm.test("Response has user data", function () {
    const response = pm.response.json();
    pm.expect(response).to.have.property('user');
    pm.expect(response.user).to.have.property('_id');
    pm.expect(response.user).to.have.property('username');
});

// Store user ID for later use
if (pm.response.code === 201) {
    const response = pm.response.json();
    pm.environment.set("USER_ID", response.user._id);
}
```

### **2. User Login**
```
POST {{BASE_URL}}/auth/login
Content-Type: application/json

Body:
{
  "email": "test1@example.com",
  "password": "password123"
}
```

**Tests Tab:**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has token", function () {
    const response = pm.response.json();
    pm.expect(response).to.have.property('token');
});

// Store token for authenticated requests
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set("TOKEN", response.token);
}
```

---

## **🏠 Room Management Tests**

### **3. Create Room**
```
POST {{BASE_URL}}/room/create
Authorization: Bearer {{TOKEN}}
Content-Type: application/json

Body:
{
  "playerName": "StoryMaster"
}
```

**Tests Tab:**
```javascript
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});

pm.test("Response has room code", function () {
    const response = pm.response.json();
    pm.expect(response).to.have.property('roomCode');
    pm.expect(response.roomCode).to.have.length(6);
});

// Store room code for later use
if (pm.response.code === 201) {
    const response = pm.response.json();
    pm.environment.set("ROOM_CODE", response.roomCode);
}
```

### **4. Join Room (Different User)**
First, create another user account, then:

```
POST {{BASE_URL}}/room/join
Authorization: Bearer {{TOKEN}}
Content-Type: application/json

Body:
{
  "roomCode": "{{ROOM_CODE}}",
  "playerName": "Player2"
}
```

**Tests Tab:**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Successfully joined room", function () {
    const response = pm.response.json();
    pm.expect(response).to.have.property('message');
    pm.expect(response.message).to.include('Joined room successfully');
});
```

### **5. Get Room Details**
```
GET {{BASE_URL}}/room/{{ROOM_CODE}}
Authorization: Bearer {{TOKEN}}
```

**Tests Tab:**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Room has players", function () {
    const response = pm.response.json();
    pm.expect(response).to.have.property('players');
    pm.expect(response.players).to.be.an('array');
    pm.expect(response.players.length).to.be.greaterThan(0);
});

pm.test("Players have chosen names", function () {
    const response = pm.response.json();
    response.players.forEach(player => {
        pm.expect(player).to.have.property('playerName');
        pm.expect(player.playerName).to.not.be.empty;
    });
});
```

---

## **🎮 Game Management Tests**

### **6. Start Game**
```
POST {{BASE_URL}}/game/start
Authorization: Bearer {{TOKEN}}
Content-Type: application/json

Body:
{
  "roomCode": "{{ROOM_CODE}}"
}
```

**Tests Tab:**
```javascript
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});

pm.test("Game started successfully", function () {
    const response = pm.response.json();
    pm.expect(response).to.have.property('gameId');
    pm.expect(response).to.have.property('title');
    pm.expect(response).to.have.property('genre');
    pm.expect(response).to.have.property('players');
});

// Store game ID for later use
if (pm.response.code === 201) {
    const response = pm.response.json();
    pm.environment.set("GAME_ID", response.gameId);
}
```

### **7. Submit Story Turn**
```
POST {{BASE_URL}}/game/turn
Authorization: Bearer {{TOKEN}}
Content-Type: application/json

Body:
{
  "roomCode": "{{ROOM_CODE}}",
  "text": "Once upon a time, in a mystical forest, there lived a brave adventurer who discovered an ancient map."
}
```

**Tests Tab:**
```javascript
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});

pm.test("Turn added successfully", function () {
    const response = pm.response.json();
    pm.expect(response).to.have.property('message');
    pm.expect(response.message).to.include('Turn added');
});
```

### **7.5. Leave Game (During Active Game)**
```
POST {{BASE_URL}}/game/leave
Authorization: Bearer {{TOKEN}}
Content-Type: application/json

Body:
{
  "roomCode": "{{ROOM_CODE}}"
}
```

**Tests Tab:**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Left game successfully", function () {
    const response = pm.response.json();
    pm.expect(response).to.have.property('message');
    pm.expect(response.message).to.include('Left game successfully');
});

pm.test("Response indicates game status", function () {
    const response = pm.response.json();
    pm.expect(response).to.have.property('gameEnded');
    pm.expect(response).to.have.property('roomClosed');
});
```

---

## **⚖️ Judgement Tests**

### **8. Get Story Judgement**
```
POST {{BASE_URL}}/game/judgement
Authorization: Bearer {{TOKEN}}
Content-Type: application/json

Body:
{
  "roomCode": "{{ROOM_CODE}}"
}
```

**Tests Tab:**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has verdict and scores", function () {
    const response = pm.response.json();
    pm.expect(response).to.have.property('verdict');
    pm.expect(response).to.have.property('scores');
    pm.expect(response.verdict).to.be.oneOf(['WIN', 'LOSE']);
    
    // Check scores structure
    pm.expect(response.scores).to.have.property('flow');
    pm.expect(response.scores).to.have.property('creativity');
    pm.expect(response.scores).to.have.property('vibe');
    pm.expect(response.scores).to.have.property('immersion');
});
```

---

## **📚 Archive Tests**

### **9. Get User Games**
```
GET {{BASE_URL}}/game/archive
Authorization: Bearer {{TOKEN}}
```

**Tests Tab:**
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has archives", function () {
    const response = pm.response.json();
    pm.expect(response).to.have.property('archives');
    pm.expect(response.archives).to.be.an('array');
});

pm.test("Archives have proper structure", function () {
    const response = pm.response.json();
    if (response.archives.length > 0) {
        const archive = response.archives[0];
        pm.expect(archive).to.have.property('id');
        pm.expect(archive).to.have.property('verdict');
        pm.expect(archive).to.have.property('story');
        pm.expect(archive).to.have.property('title');
    }
});
```

---

## **🧪 Test Scenarios**

### **Scenario 1: Complete Game Flow**
1. Create User 1 → Signup
2. Create User 2 → Signup  
3. User 1 → Create Room
4. User 2 → Join Room
5. User 1 → Start Game
6. User 1 → Submit Turn
7. User 2 → Submit Turn
8. Get Judgement
9. Check Archive

### **Scenario 2: Multiple Players**
1. Create 3-4 users
2. Create room with User 1
3. Join room with Users 2, 3, 4
4. Start game
5. Each user submits turns
6. Get final judgement

### **Scenario 3: Error Handling**
1. Try to join non-existent room
2. Try to start game without being host
3. Try to submit turn out of order
4. Try to access without authentication

---

## **🔍 Environment Variables Reference**

| Variable | Description | Example |
|----------|-------------|---------|
| `{{BASE_URL}}` | API base URL | `http://localhost:5000` |
| `{{TOKEN}}` | JWT authentication token | `eyJhbGciOiJIUzI1NiIs...` |
| `{{USER_ID}}` | Current user's ID | `507f1f77bcf86cd799439011` |
| `{{ROOM_CODE}}` | Active room code | `ABC123` |
| `{{GAME_ID}}` | Active game ID | `507f1f77bcf86cd799439012` |

---

## **📝 Test Data Examples**

### **Good Story Examples:**
```json
{
  "text": "The ancient castle stood majestically on the hill, its stone walls weathered by centuries of wind and rain. Inside, mysterious whispers echoed through the grand halls, telling tales of forgotten treasures and lost souls."
}
```

### **Poor Story Examples:**
```json
{
  "text": "... --- random words the and or but in on at"
}
```

---

## **✅ Expected Results**

- **Room Creation**: 6-character room codes
- **Room Joining**: Players added with chosen names
- **Game Start**: AI player included, game metadata generated
- **Story Turns**: Proper turn order, AI contributions
- **Judgement**: Balanced scoring, WIN/LOSE verdicts
- **Archive**: Complete game history with proper names

---

**Happy Testing! 🎮✨**
