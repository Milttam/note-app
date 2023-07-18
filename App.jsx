import React from "react"
import Sidebar from "./components/Sidebar"
import Editor from "./components/Editor"
import Split from "react-split"
//import { nanoid } from "nanoid"
import { notesCollection, db} from "./firebase"
import { onSnapshot, addDoc, doc, deleteDoc } from "firebase/firestore"

export default function App() {
    //create notes state which will store array of notes
    //use an arrow function to do lazy state init, which only initializes 
    //the state after a refresh, not after every render
    const [notes, setNotes] = React.useState(
        () => JSON.parse(localStorage.getItem("notes")) || []
    )

    //create current Not id state which defaults to first note in notes
    const [currentNoteId, setCurrentNoteId] = React.useState(
        (notes[0]?.id) || ""
    )
    
    //easily 
    const currentNote = 
        notes.find(note => note.id === currentNoteId) 
        || notes[0]

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

    //need to make async function since we are waiting for response
    async function createNewNote() {
        const newNote = {
            body: "# Type your markdown note's title here"
        }
        //response to addDoc will be a reference to the new note (a document in firestore)
        const newNoteRef = await addDoc(notesCollection, newNote)
        setCurrentNoteId(newNoteRef.id)
    }

    function updateNote(text) {
        setNotes(oldNotes => {
            const newArray = []
            for (let i = 0; i < oldNotes.length; i++) {
                const oldNote = oldNotes[i]
                if (oldNote.id === currentNoteId) {
                    // Put the most recently-modified note at the top
                    newArray.unshift({ ...oldNote, body: text })
                } else {
                    newArray.push(oldNote)
                }
            }
            return newArray
        })
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
                            notes={notes}
                            currentNote={currentNote}
                            setCurrentNoteId={setCurrentNoteId}
                            newNote={createNewNote}
                            deleteNote={deleteNote}
                        />
                        {
                            currentNoteId &&
                            notes.length > 0 &&
                            <Editor
                                currentNote={currentNote}
                                updateNote={updateNote}
                            />
                        }
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
