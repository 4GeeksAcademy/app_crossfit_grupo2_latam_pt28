import React, { useState, useEffect, useContext } from "react"; // Importación de React y algunos hooks
import { Link } from "react-router-dom"; // Importación de Link para la navegación
import { Context } from "../store/appContext"; // Importación del contexto
import { useNavigate } from "react-router-dom"; // Importación de useNavigate para la navegación programática

const Signup = () => {
    const { store, actions } = useContext(Context);
    const [email, setEmail] = useState("")
    const [name, setName] = useState("")
    const [lastname, setLastname] = useState("")
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [role, setRole] = useState("")
    const [question1, setQuestion1] = useState("")
    const [answer1, setAnswer1] = useState("")
    const [question2, setQuestion2] = useState("")
    const [answer2, setAnswer2] = useState("")
    const navigate = useNavigate();

    const handlerSubmit = async (e) => {
        e.preventDefault()
        if (email != "" && name != "" &&  lastname != "" && username != "" && password != "") {

            try {
                await actions.Signup_normal_user(email, name, lastname, username ,password, role, question1, answer1, question2, answer2)
            } catch (error) {
                console.error(error)
            }
        }
        else {
            console.log("faltan datos")
        }
        navigate('/Login');
    }

    return ( 

        <form>
            <div className="mb-3">
                <label htmlFor="exampleInputEmail1" className="form-label">Email address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} name="email" className="form-control" id="exampleInputEmail1" aria-describedby="emailHelp" />
                <div id="emailHelp" className="form-text">We'll never share your email with anyone else.</div>
            </div>

            <div className="mb-3">
                <label htmlFor="exampleInputName1" className="form-label">Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} name="text" className="form-control" id="exampleInputEmail1" aria-describedby="emailHelp" />
                <div id="emailHelp" className="form-text">Type your Name.</div>
            </div>

            <div className="mb-3">
                <label htmlFor="exampleInputName1" className="form-label">Last name</label>
                <input type="text" value={lastname} onChange={(e) => setLastname(e.target.value)} name="text" className="form-control" id="exampleInputEmail1" aria-describedby="emailHelp" />
                <div id="emailHelp" className="form-text">Type your lastname.</div>
            </div>

            <div className="mb-3">
                <label htmlFor="exampleInputName1" className="form-label">Username</label>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} name="text" className="form-control" id="exampleInputEmail1" aria-describedby="emailHelp" />
                <div id="emailHelp" className="form-text">Type your username.</div>
            </div>

            <div className="mb-3">
                <label htmlFor="exampleInputPassword1" className="form-label">Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} name="password" className="form-control" id="exampleInputPassword1" />
            </div>

            <div className="mb-3">
                <label htmlFor="exampleInputPassword1" className="form-label">Role</label>
                <input type="text" value={role} onChange={(e) => setRole(e.target.value)} name="role" className="form-control" id="exampleInputPassword1" />
            </div>

            <div className="mb-3">
                <label htmlFor="exampleInputPassword1" className="form-label">Question</label>
                <input type="text" value={question1} onChange={(e) => setQuestion1(e.target.value)} name="question1" className="form-control" id="exampleInputPassword1" />
            </div>

            <div className="mb-3">
                <label htmlFor="exampleInputPassword1" className="form-label">Answer</label>
                <input type="text" value={answer1} onChange={(e) => setAnswer1(e.target.value)} name="answer1" className="form-control" id="exampleInputPassword1" />
            </div>

            <div className="mb-3">
                <label htmlFor="exampleInputPassword1" className="form-label">Question</label>
                <input type="text" value={question2} onChange={(e) => setQuestion2(e.target.value)} name="question2" className="form-control" id="exampleInputPassword1" />
            </div>

            <div className="mb-3">
                <label htmlFor="exampleInputPassword1" className="form-label">Answer</label>
                <input type="text" value={answer2} onChange={(e) => setAnswer2(e.target.value)} name="answer2" className="form-control" id="exampleInputPassword1" />
            </div>

            <div className="mb-3 form-check">
                <input type="checkbox" className="form-check-input" id="exampleCheck1" />
                <label className="form-check-label" htmlFor="exampleCheck1">Check me out</label>
            </div>

            <button type="submit" onClick={(e) => handlerSubmit(e)} className="btn btn-primary">Submit</button>

        </form>
    )
}


export default Signup