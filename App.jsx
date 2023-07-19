import React from "react"
import Sidebar from "./components/Sidebar"
import Editor from "./components/Editor"
import Split from "react-split"
//import { nanoid } from "nanoid"
import { notesCollection, db} from "./firebase"
import { onSnapshot, addDoc, doc, deleteDoc, setDoc } from "firebase/firestore"

export default function App() {
    //create notes state which will store array of notes
    //use an arrow function to do lazy state init, which only initializes 
    //the state after a refresh, not after every render
    const [notes, setNotes] = React.useState(
        () => JSON.parse(localStorage.getItem("notes")) || []
    )

    //create current Not id state which defaults to empty string
    const [currentNoteId, setCurrentNoteId] = React.useState("")

    const [tempNoteText, setTempNoteText] = React.useState("")
    
    //easily 
    const currentNote = 
        notes.find(note => note.id === currentNoteId) 
        || notes[0]

    //create sorted Notes array 
    const sortedArray = notes.sort((a,b)=>b.updatedAt-a.updatedAt)


    //only setting up the onsnapshot event listener once 
    React.useEffect(() => {
        // since we don't want to leave memory leaks (leave unclosed event listeners, we need to close it)
        const unsub = onSnapshot(notesCollection, (snapshot)=>{
            //Note: this inner function will run whenever something changes
            // i.e. whenever there is a discrepancy between local state and database

            // sync local notes with snapshot data 
            console.log("things are changing")

            //reformat data from firestore 
            const notesArr = snapshot.docs.map(doc => ({ //docs are the snapshot documents we need to reformat
                ...doc.data(),
                id: doc.id
            }))
            setNotes(notesArr)
        })
        //return a "clean-up" function to handle sideEffects
        return unsub 
    }, [])

    //set current note id whenever notes changes
    React.useEffect(() => {
        if (!currentNoteId) {
            setCurrentNoteId(notes[0].id)
        }
    }, [notes])

    //set tempNoteText to currentNote.body 
    React.useEffect(()=> {
        if (currentNote) {
            setTempNoteText(currentNote.body)
        }  
    },[currentNote])

    //Debouncing: update note only every 500ms
    React.useEffect(() => {
        //create timer which only runs the inside function every 500ms and store
        //the id of the timer to remove it after
        const timeoutId = setTimeout(() => {
            //add condition to only update if text is diff. So that a click does not change the order
            if (tempNoteText != currentNote.body){
                updateNote(tempNoteText)
            }
        }, 500)

        //Once updated, return a function that will clear the timer 
        return () => clearTimeout(timeoutId)
    }, [tempNoteText]) //run again when tempNoteText is modified

    //need to make async function since we are waiting for response
    async function createNewNote() {
        //crewate new Note with fields body, created, and updatedAt attributes
        const newNote = {
            body: "# Type your markdown note's title here",
            createdAt: Date.now(),
            updatedAt: Date.now()
        }
        //response to addDoc will be a reference to the new note (a document in firestore)
        const newNoteRef = await addDoc(notesCollection, newNote)
        setCurrentNoteId(newNoteRef.id)
    }

    async function updateNote(text) {
        //Old code for local state update Note
        // setNotes(oldNotes => {
        //     const newArray = []
        //     for (let i = 0; i < oldNotes.length; i++) {
        //         const oldNote = oldNotes[i]
        //         if (oldNote.id === currentNoteId) {
        //             // Put the most recently-modified note at the top
        //             newArray.unshift({ ...oldNote, body: text })
        //         } else {
        //             newArray.push(oldNote)
        //         }
        //     }
        //     return newArray
        // })

        //connect updateNote to database
        const docRef = doc(db, "notes",currentNoteId)
        await setDoc(docRef,{body: text, updatedAt:Date.now()}, {merge: true}) 
        //merge allows us to merge object in 2nd param to the already existing object in db
    }

    async function deleteNote(noteId) {
        // Refactored: dont need this line anymore since we are deleting from firestore now
        //setNotes(oldNotes => oldNotes.filter(note => note.id !== noteId))

        //get the document reference we want to delete using func
        const docRef = doc(db, "notes",noteId)
        //call delete operation and wait for response
        await deleteDoc(docRef)
    }

    return (
        <main>
            {
                notes.length > 0
                    ?
                    
                    <Split
                        sizes={[30, 70]}
                        direction="horizontal"
                        className="split"
                    >
                        <Sidebar
                            notes={sortedArray}
                            currentNote={currentNote}
                            setCurrentNoteId={setCurrentNoteId}
                            newNote={createNewNote}
                            deleteNote={deleteNote}
                        />
                        <Editor
                            tempNoteText={tempNoteText}
                            setTempNoteText={setTempNoteText}
                        />
        
                    </Split>
                    :
                    <div className="no-notes">
                        <h1>You have no notes</h1>
                        <button
                            className="first-note"
                            onClick={createNewNote}
                        >
                            Create one now
                </button>
                    </div>

            }
        </main>
    )
}
