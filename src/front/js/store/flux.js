

const getState = ({ getStore, getActions, setStore }) => {
	return {
		store: {
			users: [],
			user: {},
			isAuthenticated: null,
			uploadedUserData: [],
			isAuthenticatedMessage: null,
			loginError: [],
			dataRole: [],
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
			creationState: null,
			createError: [],
			trainingClasses: [],  // Array para almacenar las clases
			reservedClasses: [],
			cancelBooking: [],
			creationTrainingClasses: [],
			bookingData: [],
			memberships: [],
			membershipsLoading: false,
			editTrainingClass: []






		},
		actions: {

			validateToken: async (token) => {
				try {
					const url = `${process.env.BACKEND_URL}api/validate-token`;


					const response = await fetch(url, // URL del servidor
						{
							method: "GET",  // Cambio a método GET, ya que el endpoint no necesita datos de entrada adicionales
							headers: {
								"Authorization": `Bearer ${token}`  // Solo necesitamos el token para la autorización
							}
						});
					if (response.ok) {
						const data = await response.json();
						if (data.user) {  // Verificamos si la respuesta contiene el objeto usuario
							setStore({
								isAuthenticated: true
							});
						} else {
							setStore({
								isAuthenticated: false
							});
							console.error("Token inválido o usuario no encontrado");
						}
					} else {
						setStore({
							isAuthenticated: false
						});
						console.error("Error validando el token", await response.text());  // Es útil ver el mensaje de error del servidor
					}
				} catch (error) {
					console.error("Error en la función validateToken:", error);
					setStore({
						isAuthenticated: false
					});
				}
			},


			loginUserV2: async (email, password) => { // Se define una función llamada handleLogin que se ejecutará al iniciar sesión

				if (email.trim() === "" || password.trim() === "") { // Verifica si el campo de email o contraseña están vacíos
					// console.error("Por favor completa todos los campos.");
					return; // Detener el proceso si algún campo está vacío
				}

				try {
					const url = `${process.env.BACKEND_URL}api/token`;


					let response = await fetch(url, // URL del servidor
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
						localStorage.setItem("token", data.access_token);
						let store = getStore();
						setStore({
							...store, isAuthenticated: true, isAuthenticatedMessage: true, loginError: null, dataRole: data.role // Asumiendo que 'data' incluye 'role'
						});
					} else if (data.error) {
						setStore({
							isAuthenticated: false,
							isAuthenticatedMessage: false,
							loginError: data.error,
							dataRole: null
						});
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
					const url = `${process.env.BACKEND_URL}api/user`;

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
					//	console.log(data)
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
					const url = `${process.env.BACKEND_URL}api/singup/user`;

					let response = await fetch(url, {
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

			//funcion asincrona y fetch para vista de reservas(bookings) para admin
			getBookings: async () => {

				try {
					const response = await fetch(process.env.BACKEND_URL + "api/booking", {
						headers: { "Content-Type": "application/json" }
					})
					const data = await response.json()
					console.log(data)
					// Setstore guarda la informacion en este caso un array 
					setStore({ bookingData: data })

				} catch (error) {
					console.error(error)
				}
			},


			//funcion asincrona y fetch para vista de clases del coach para admin
			getClasses: async () => {

				try {
					const response = await fetch(process.env.BACKEND_URL + "/api/training_classes", {
						headers: { "Content-Type": "application/json" }
					})
					const data = await response.json()
					console.log(data)
					// Setstore guarda la informacion en este caso un array 
					setStore({ training_classes_Data: data })

				} catch (error) {
					console.error(error)
				}
			},

			loadTrainingClasses: async () => {
				try {
					// Obtenemos el token del almacenamiento local
					let myToken = localStorage.getItem("token");

					const url = `${process.env.BACKEND_URL}api/training_classes`;
					let response = await fetch(url, {
						method: "GET", // Método de la solicitud
						headers: {
							Authorization: `Bearer ${myToken}`
							// Se incluye el token de autorización en los encabezados concatenamos con el nombre del tipo de token "BearerToken"
						},
					});

					if (response.ok) {
						const data = await response.json();
						setStore({ ...getStore(), trainingClasses: data });  // Actualiza el estado con las clases obtenidas
					} else {
						throw new Error("Failed to fetch classes");
					}
				} catch (error) {
					console.error("Error loading training classes:", error);
				}
			},

			book_class: async (classId) => { // Se define una función llamada userDataHelp que se ejecutará para obtener datos de usuario con ayuda del token

				let id_class = { training_class_id: classId };
				console.log(id_class);


				try {
					// Obtenemos el token del almacenamiento local
					let myToken = localStorage.getItem("token");
					// console.log(myToken);
					// console.log(id_class);
					// Construimos la URL para la solicitud
					let url = `${process.env.BACKEND_URL}/api/book_class`;

					// Realizamos una solicitud a la URL usando fetch, incluyendo el token de autorización en los encabezados
					let response = await fetch(url, {
						method: "POST", // Método de la solicitud
						headers: {
							"Authorization": `Bearer ${myToken}`,// Se incluye el token de autorización en los encabezados concatenamos con el nombre del tipo de token "BearerToken"
							"Content-Type": "application/json", // Especifica que el cuerpo de la solicitud es JSON
						},
						body: JSON.stringify(id_class)

					});

					let data = await response.json();

					if (response.ok) {
						// Asumiendo que quieres actualizar el store aquí
						let store = getStore();
						setStore({ ...store, reservedClasses: data });
						return { success: true, data: data };
					} else {
						// Incluir la respuesta en la acción puede ayudar a manejar el estado más localmente
						return { success: false, error: data.error || "Unknown error occurred." };
					}
				} catch (error) {
					console.error("Error booking class:", error);
					return { success: false, error: error.message };
				}
			},

			cancel_booking: async (booking_id) => { // Se define una función llamada userDataHelp que se ejecutará para obtener datos de usuario con ayuda del token

				console.log("id_que_se_pasa", booking_id)
				try {
					// Obtenemos el token del almacenamiento local
					let myToken = localStorage.getItem("token");

					// Construimos la URL para la solicitud
					let url = `${process.env.BACKEND_URL}api/cancel_booking/${booking_id}`;

					// Realizamos una solicitud a la URL usando fetch, incluyendo el token de autorización en los encabezados
					let response = await fetch(url, {
						method: "DELETE", // Método de la solicitud
						headers: {
							Authorization: `Bearer ${myToken}`// Se incluye el token de autorización en los encabezados concatenamos con el nombre del tipo de token "BearerToken"
						},

					});
					let data = await response.json();
					console.log("data servidor", data)
					let store = getStore();
					setStore({ ...store, cancelBooking: data });



					// Imprimimos el estado de la tienda después de cargar los datos (solo para depuración)
					// console.log("Store after data loaded:", store);
				} catch (error) {
					console.error("Error booking class:", error);
					// Si ocurre algún error durante el proceso, lo capturamos y lo mostramos en la consola
				}
			},

			updateUserData: async (userData) => {

				// Obtenemos el token del almacenamiento local
				let myToken = localStorage.getItem("token");
				// console.log(myToken);
				// console.log(userData);
				// Construimos la URL para la solicitud
				let url = `${process.env.BACKEND_URL}api/user`;

				// Realizamos una solicitud a la URL usando fetch, incluyendo el token de autorización en los encabezados
				let response = await fetch(url, {
					method: "PUT", // Método de la solicitud
					headers: {
						"Authorization": `Bearer ${myToken}`,// Se incluye el token de autorización en los encabezados concatenamos con el nombre del tipo de token "BearerToken"
						"Content-Type": "application/json", // Especifica que el cuerpo de la solicitud es JSON
					},
					body: JSON.stringify(userData)

				});

				let data = await response.json();
				// console.log(data)
				if (response.ok) {
					// setStore({ ...getStore(), uploadedUserData: data.updatedUser });
					alert('Usuario actualizado correctamente');
				} else {
					alert('Error al actualizar usuario: ' + data.error);
				}
			},

			// Función para crear una clase individual
			createTrainingClasses: async (dataClasses) => {
				// Obtenemos el token del almacenamiento local
				let myToken = localStorage.getItem("token");
				// Construimos la URL para la solicitud
				let url = `${process.env.BACKEND_URL}api/training_classes`;

				try {
					let response = await fetch(url, {
						method: "POST", // Método de la solicitud
						headers: {
							"Authorization": `Bearer ${myToken}`,// Se incluye el token de autorización en los encabezados concatenamos con el nombre del tipo de token "BearerToken"
							"Content-Type": "application/json", // Especifica que el cuerpo de la solicitud es JSON
						},
						body: JSON.stringify(dataClasses)

					});
					let data = await response.json(); // Se espera la respuesta del servidor en formato JSON
					console.log(data)

					// Verificamos si la respuesta de la solicitud es exitosa (status code 200-299)
					if (response.ok) {
						// Asumiendo que quieres actualizar el store aquí
						let store = getStore();
						setStore({ ...store, creationTrainingClasses: data });
						return { success: true, data: data };
					} else {
						// Incluir la respuesta en la acción puede ayudar a manejar el estado más localmente
						return { success: false, error: data.error || "Unknown error occurred." };
					}

					// console.log('data after setTimeout',data)

				} catch (error) {
					// console.error(error);
					throw new Error(`Error login: ${error.message}`); // Se maneja cualquier error que ocurra durante el proceso de inicio de sesión
				}
			},

			// Función para crear un lote de clases completamente independiente
			createBatchClasses: async (formData) => {
				let startDate = new Date(formData.dateTime_class);
				let endDate = new Date(formData.endDate);
				let myToken = localStorage.getItem("token");
				let url = `${process.env.BACKEND_URL}api/training_classes`;
				let errors = [];
				let successfulCreations = [];

				while (startDate <= endDate) {
					let classData = {
						...formData,
						dateTime_class: startDate.toISOString().split('T')[0] + ' ' + formData.start_time
					};

					try {
						let response = await fetch(url, {
							method: "POST",
							headers: {
								"Authorization": `Bearer ${myToken}`,
								"Content-Type": "application/json",
							},
							body: JSON.stringify(classData)
						});
						let data = await response.json();
						if (response.ok) {
							successfulCreations.push(data);
						} else {
							errors.push({ error: data.error || "Unknown error occurred.", date: startDate.toISOString() });
						}
					} catch (error) {
						errors.push({ error: error.message, date: startDate.toISOString() });
					}

					startDate.setDate(startDate.getDate() + 1); // Incrementa el día
				}

				// Actualiza el store al final del proceso
				let store = getStore(); // Obtiene el estado actual del store
				setStore({ ...store, creationTrainingClasses: successfulCreations }); // Actualiza el store con las nuevas clases creadas
				// Decide qué hacer con los errores y éxitos después de procesar todas las fechas
				if (errors.length > 0) {
					return { success: false, messageError: 'Some errors occurred.', errors: errors };
				}
				return { success: true, message: 'All classes were created successfully' };

			},

			resetCreationTrainingClasses: () => {
				setStore({ ...getStore(), creationTrainingClasses: [] });
			},

			getBookings: async () => {

				// Obtenemos el token del almacenamiento local
				let myToken = localStorage.getItem("token");

				const url = `${process.env.BACKEND_URL}api/booking`;


				try {
					let response = await fetch(url, {
						method: "PUT", // Método de la solicitud
						headers: {
							'Content-Type': 'application/json',
							'Authorization': `Bearer ${myToken}`, // Asegúrate de manejar la autenticación adecuadamente
						}
					});
					const data = await response.json();
					if (response.ok) {
						setStore({ ...getStore(), bookingData: data });  // Actualiza el estado con las clases obtenidas
						console.log(data)
					} else {
						throw new Error("Failed to fetch classes");
					}
				} catch (error) {
					console.error("Error loading training classes:", error);
				}
			},

			loadMemberships: async () => {
				// Obtenemos el token del almacenamiento local
				let myToken = localStorage.getItem("token");

				let url = `${process.env.BACKEND_URL}api/memberships`; // Asume que tienes una variable de entorno para tu URL del backend

				try {
					let response = await fetch(url, {
						method: 'GET',
						headers: {
							'Content-Type': 'application/json',
							'Authorization': `Bearer ${myToken}`, // Asegúrate de manejar la autenticación adecuadamente
						}
					});
					if (!response.ok) {
						throw new Error("Failed to fetch memberships: " + response.statusText);
					}
					let memberships = await response.json();
					setStore({
						...getStore(),
						memberships: memberships
					});
				} catch (error) {
					console.error("Error loading memberships:", error);
				}
			},


			purchaseMembership: async (data) => {
				// console.log(data)
				// Obtenemos el token del almacenamiento local
				let myToken = localStorage.getItem("token");

				let url = `${process.env.BACKEND_URL}api/purchase_membership`; // URL del endpoint para comprar membresía
				try {
					let response = await fetch(url, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							'Authorization': `Bearer ${myToken}` // Asegúrate de manejar la autenticación adecuadamente
						},
						body: JSON.stringify(data)
					});

					let result = await response.json(); // Se espera la respuesta del servidor en formato JSON
					// console.log("respuesta del servidor compra: ", result);

					// Verificamos si la respuesta de la solicitud es exitosa (status code 200-299)
					if (response.ok) {
						return { success: true, data: result };
					} else {
						// Incluir la respuesta en la acción puede ayudar a manejar el estado más localmente
						return { success: false, error: result.error || "Unknown error occurred." };
					}


				} catch (error) {
					console.error("Error purchasing membership:", error);
					return { success: false, error: error.message }; // Devuelve un objeto de error si algo falla
				}
			},


			getUsers: async () => {
				// Obtenemos el token del almacenamiento local
				let myToken = localStorage.getItem("token");

				try {
					let response = await fetch("https://fantastic-xylophone-wrr5p4xqpjxj35x7-3001.app.github.dev/api/users",
						{
							method: "GET",
							headers: {
								"Content-Type": "application/json",
								// Incluye el token de autorización si es necesario
								Authorization: `Bearer ${myToken}`,
							},
						});
					console.log(response)
					if (!response.ok) {
						throw new Error(`Error fetching users: ${response.statusText}`);
					}

					let data = await response.json();
					console.log(data);


					let store = getStore(); // Obtiene el estado actual del almacén
					setStore({ ...store, users: data }); // Actualiza el estado con los usuarios obtenidos

				} catch (error) {
					console.error(error); // Maneja cualquier error que ocurra durante el proceso

				}

			},

			getOneuser: async (id) => {
				// Obtenemos el token del almacenamiento local
				let myToken = localStorage.getItem("token");

				try {
					let response = await fetch(`https://fantastic-xylophone-wrr5p4xqpjxj35x7-3001.app.github.dev/api/user/${id}`,
						{
							method: "GET",
							headers: {
								"Content-Type": "application/json",
								// Incluye el token de autorización si es necesario
								Authorization: `Bearer ${myToken}`,
							},
						});
					console.log(response);
					if (!response.ok) {
						throw new Error(`Error fetching user: ${response.statusText}`);
					}

					let data = await response.json();
					console.log(data);

					let store = getStore(); // Obtiene el estado actual del almacén
					setStore({ ...store, user: data }); // Actualiza el estado con el usuario obtenido

				} catch (error) {
					console.error(error); // Maneja cualquier error que ocurra durante el proceso
				}
			},

			

			//funcion asincrona para editar clases desde usuario master
			editClasses: async (dataClasses) => {
				console.log(dataClasses)
				// Obtenemos el token del almacenamiento local
				let myToken = localStorage.getItem("token");
				// Construimos la URL para la solicitud
				let url = `${process.env.BACKEND_URL}api/training_classes/<int:class_id">)`;

				try {
					let response = await fetch(url, {
						method: "PUT", // Método de la solicitud
						headers: {
							"Authorization": `Bearer ${myToken}`,// Se incluye el token de autorización en los encabezados concatenamos con el nombre del tipo de token "BearerToken"
							"Content-Type": "application/json", // Especifica que el cuerpo de la solicitud es JSON
						},
						body: JSON.stringify(dataClasses)

					});
					let data = await response.json(); // Se espera la respuesta del servidor en formato JSON
					console.log(data)

					// Verificamos si la respuesta de la solicitud es exitosa (status code 200-299)
					if (response.ok) {
						// Asumiendo que quieres actualizar el store aquí
						let store = getStore();
						setStore({ ...store, editTrainingClasses: data });
						return { success: true, data: data };
					} else {
						// Incluir la respuesta en la acción puede ayudar a manejar el estado más localmente
						return { success: false, error: data.error || "Unknown error occurred." };
					}

					// console.log('data after setTimeout',data)

				} catch (error) {
					// console.error(error);
					throw new Error(`Error login: ${error.message}`); // Se maneja cualquier error que ocurra durante el proceso de inicio de sesión
				}
			},

			// Función para crear un lote de clases completamente independiente
			editBatchClasses: async (formData) => {
				let startDate = new Date(formData.dateTime_class);
				let endDate = new Date(formData.endDate);
				let myToken = localStorage.getItem("token");
				let url = `${process.env.BACKEND_URL}api/training_classes`;
				let errors = [];
				let successfulCreations = [];

				while (startDate <= endDate) {
					let classData = {
						...formData,
						dateTime_class: startDate.toISOString().split('T')[0] + ' ' + formData.start_time
					};

					try {
						let response = await fetch(url, {
							method: "PUT",
							headers: {
								"Authorization": `Bearer ${myToken}`,
								"Content-Type": "application/json",
							},
							body: JSON.stringify(classData)
						});
						let data = await response.json();
						if (response.ok) {
							successfulCreations.push(data);
						} else {
							errors.push({ error: data.error || "Unknown error occurred.", date: startDate.toISOString() });
						}
					} catch (error) {
						errors.push({ error: error.message, date: startDate.toISOString() });
					}

					startDate.setDate(startDate.getDate() + 1); // Incrementa el día
				}

				// Actualiza el store al final del proceso
				let store = getStore(); // Obtiene el estado actual del store
				setStore({ ...store, creationTrainingClasses: successfulCreations }); // Actualiza el store con las nuevas clases creadas
				// Decide qué hacer con los errores y éxitos después de procesar todas las fechas
				if (errors.length > 0) {
					return { success: false, messageError: 'Some errors occurred.', errors: errors };
				}
				return { success: true, message: 'All classes were created successfully' };

			},

		},
	}

};

export default getState;
