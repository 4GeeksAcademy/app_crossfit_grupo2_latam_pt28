
const getState = ({ getStore, getActions, setStore }) => {
	return {
		store: {
			
		},
		actions: {
			// Use getActions to call a function within a fuction

			//Conexion con backend desde la ruta del component login
			login: async (mail, password) => {
				
				try {
					const response=await fetch(process.env.BACKEND_URL+"/",{
						method:"POST",
						body:JSON.stringify({
							mail:mail,
							password:password
						}),
						headers:{"Content-Type":"application/json"}
					})
					const data=await response.json()
					console.log(data)
				} catch (error) {
					console.error(error)
				}  
			},

			//Conexion con backend desde la ruta del component Signup
			Signup_normal_user: async (email, name, lastname, username ,password, role, question1, answer1,question2, answer2 ) => {
				console.log(email, name, lastname, username ,password, role, question1, answer1, question2, answer2)
				try {
					const response=await fetch(process.env.BACKEND_URL+"/api/singup/user",{
						method:"POST",
						body:JSON.stringify({
							email:email,
							name: name,
							lastname: lastname,
							username:username,
							password:password,
							role:role, 
							security_question:[{question1:question1, answer1:answer1},{question2:question2, answer2:answer2}]
						}),
						headers:{"Content-Type":"application/json"}
					})
					const data=await response.json()
					console.log(data)
					
				} catch (error) {
					console.error(error)
				}  
			},

		}
	};
};

export default getState;
