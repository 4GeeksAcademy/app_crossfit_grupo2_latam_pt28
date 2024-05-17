

const getState = ({ getStore, getActions, setStore }) => {
	return {
		store: {
			isAuthenticated: null,
			uploadedUserData: [],
			isAuthenticatedMessage: null,
			loginError: [],
			dataUser: { // Objeto que almacena los datos del usuario
				email: "", // Correo electrónico del usuario (inicializado como cadena vacía)
				name: "", // Nombre del usuario (inicializado como cadena vacía)
				last_name: "", // Apellido del usuario (inicializado como cadena vacía)
				username: "", // Nombre de usuario del usuario (inicializado como cadena vacía)
				password: "", // Contraseña del usuario (inicializada como cadena vacía)
				security_questions: [ // Array que almacena las preguntas y respuestas de seguridad del usuario
					{ question: "", answer: "" }, // Pregunta y respuesta de seguridad 1 (ambos inicializados como cadena vacía)
					{ question: "", answer: "" } // Pregunta y respuesta de seguridad 2 (ambos inicializados como cadena vacía)
				]
			},
			bookingData: [],
			creationState: null,
			createError: [],

		},
		actions: {
			loginUserV2: async (email, password) => { // Se define una función llamada handleLogin que se ejecutará al iniciar sesión

				if (email.trim() === "" || password.trim() === "") { // Verifica si el campo de email o contraseña están vacíos
					// console.error("Por favor completa todos los campos.");
					return; // Detener el proceso si algún campo está vacío
				}

				try {
					let response = await fetch( // Se envía una solicitud POST al servidor para iniciar sesión
						"https://fantastic-xylophone-wrr5p4xqpjxj35x7-3001.app.github.dev/api/token", // URL del servidor
						{
							method: "POST", // Método de la solicitud
							headers: {
								"Content-Type": "application/json", // Tipo de contenido de la solicitud
							},
							body: JSON.stringify({ email, password }), // Datos del usuario convertidos a formato JSON y enviados en el cuerpo de la solicitud
						}
					);

					let data = await response.json(); // Se espera la respuesta del servidor en formato JSON
					console.log(data)
					if (data.access_token) { // Si se recibe un token de acceso en la respuesta
						localStorage.setItem("token", data.access_token); // Se guarda el token de acceso en el almacenamiento local del navegador
						setStore({ isAuthenticated: true, isAuthenticatedMessage: true, loginError: null }); // Actualiza el estado para indicar autenticación y limpiar errores anteriores
					} else if (data.error) { // Si se recibe un error en la respuesta
						setStore({ isAuthenticated: false, isAuthenticatedMessage: false, loginError: data.error }); // Actualiza el estado para indicar no autenticación y guarda el error

						// Ocultar el error después de 1.5 segundos
						setTimeout(() => {
							setStore({ ...getStore(), isAuthenticatedMessage: null }); // Se reinicia el estado relacionado con el login después de 3 segundos
							setStore({ ...getStore(), loginError: [] }); // Se reinicia el estado relacionado con el error después de 3 segundos

						}, 1500);
					}
					// console.log('data after setTimeout',data)


				} catch (error) {
					// console.error(error);
					throw new Error(`Error login: ${error.message}`); // Se maneja cualquier error que ocurra durante el proceso de inicio de sesión
				}
			},

			loadUserData: async () => { // Se define una función llamada userDataHelp que se ejecutará para obtener datos de usuario con ayuda del token
				try {
					// Obtenemos el token del almacenamiento local
					let myToken = localStorage.getItem("token");

					// Construimos la URL para la solicitud
					let url = "https://fantastic-xylophone-wrr5p4xqpjxj35x7-3001.app.github.dev/api/user";

					// Realizamos una solicitud a la URL usando fetch, incluyendo el token de autorización en los encabezados
					let response = await fetch(url, {
						method: "GET", // Método de la solicitud
						headers: {
							Authorization: `Bearer ${myToken}`
							// Se incluye el token de autorización en los encabezados concatenamos con el nombre del tipo de token "BearerToken"
						},
					});

					// Verificamos si la respuesta de la solicitud es exitosa (status code 200-299)
					if (!response.ok) {
						// Si la respuesta no es exitosa, lanzamos un error con un mensaje apropiado
						throw new Error(`No se pudieron recuperar los datos: ${response.statusText}`);
					}

					// Convertimos la respuesta a formato JSON para extraer los datos
					let data = await response.json();
					console.log(data)
					let store = getStore(); // Se obtiene el estado actual del almacén
					setStore({ ...store, uploadedUserData: data }); // Se actualiza el estado con los datos de usuario recuperados

					// Imprimimos el estado de la tienda después de cargar los datos (solo para depuración)
					// console.log("Store after data loaded:", store);
				} catch (error) {
					console.error(error); // Se imprime cualquier error que ocurra durante el proceso
					// Si ocurre algún error durante el proceso, lo capturamos y lo mostramos en la consola
				}
			},

			closeSession: () => { // Se define una función llamada closeSession que se utilizará para cerrar la sesión del usuario
				// Eliminar la información de inicio de sesión del almacenamiento local y restablecer los datos del usuario

				// Ocultar el error después de 1.5 segundos
				setTimeout(() => {
					setStore({
						...getStore(), // Se mantiene el resto del estado sin cambios
						isAuthenticated: null, uploadedUserData: [], isAuthenticatedMessage: null, loginError: []
					});
				}, 2000);

				// console.log(store); // Se imprime el estado actualizado en la consola (para propósitos de depuración)
			},

			createUser: async (dataUser) => {
				try {
					let response = await fetch("https://fantastic-xylophone-wrr5p4xqpjxj35x7-3001.app.github.dev/api/singup/user", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(dataUser)
					});
					let data = await response.json();
					if (response.ok) {
						setStore({ ...getStore(), creationState: { create: true, message: data.message } });
						return true; // Indica que la creación fue exitosa

					} else {
						setStore({ ...getStore(), creationState: { create: false, error: data.error } });
						return false; // Indica que hubo un error
					}
				} catch (error) {
					// console.error("Registration Error:", error);
					setStore({ ...getStore(), creationState: { create: false, error: "Registration failed due to an exception." } });
					return false;
				}
			},

			getBookings: async () => {

				try {
					const response = await fetch(process.env.BACKEND_URL + "/api/booking", {
						headers: { "Content-Type": "application/json" }
					})
					const data = await response.json()
					// Setstore guarda la informacion en este caso un array 
					setStore({bookingData:data})
					
				} catch (error) {
					console.error(error)
				}
			},


		}
	};
};

export default getState;
