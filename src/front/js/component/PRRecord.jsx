import React, { useState, useEffect, useContext } from "react"; // Importar los hooks y el contexto de React
import { Context } from "../store/appContext"; // Importar el contexto de la aplicación
import { Form, Button, Table, Modal } from 'react-bootstrap'; // Importar componentes de React Bootstrap
import * as XLSX from 'xlsx'; // Importar ibrería de JavaScript como xlsx
import styles from "./PRRecord.module.css"; // Importar los estilos del componente
import moment from 'moment'; // Importar la librería moment para el manejo de fechas

const PRRecord = () => {
    const { store } = useContext(Context); // Obtener el estado global de la aplicación
    const { uploadedUserData } = store; // Extraer los datos de usuario del estado global

    // Declaración de estados locales
    const [movements, setMovements] = useState([]); // Lista de movimientos disponibles
    const [selectedMovement, setSelectedMovement] = useState(''); // Movimiento seleccionado
    const [value, setValue] = useState(''); // Valor del movimiento (e.g., repeticiones)
    const [time, setTime] = useState(''); // Tiempo del movimiento (e.g., minutos)
    const [kg, setKg] = useState(''); // Peso en kilogramos
    const [lb, setLb] = useState(''); // Peso en libras
    const [unit, setUnit] = useState(''); // Unidad del movimiento (e.g., kg, reps)
    const [filteredMovements, setFilteredMovements] = useState([]); // Movimientos filtrados para la lista
    const [userRecords, setUserRecords] = useState([]); // Registros de movimientos del usuario
    const [showModal, setShowModal] = useState(false); // Estado para mostrar el modal de selección de movimiento
    const [showDeleteModal, setShowDeleteModal] = useState(false); // Estado para mostrar el modal de confirmación de eliminación
    const [movementToDelete, setMovementToDelete] = useState(null); // Movimiento a eliminar
    const [showAlertModal, setShowAlertModal] = useState(false); // Estado para mostrar el modal de alerta
    const [search, setSearch] = useState('');  // Estado para manejar la búsqueda


    // Lista de movimientos disponibles con sus unidades correspondientes
    const movementsList = [
        { id: 1, name: 'Snatch', unit: 'kg' },
        { id: 2, name: 'Clean and Jerk', unit: 'kg' },
        { id: 3, name: 'Deadlift', unit: 'kg' },
        { id: 4, name: 'Run', unit: 'km_min' },
        { id: 5, name: 'Eco Bike', unit: 'cal_min' },
        { id: 6, name: 'Row Erg', unit: 'cal_min' },
        { id: 7, name: 'Bike Erg', unit: 'cal_min' },
        { id: 8, name: 'Ski Erg', unit: 'cal_min' },
        { id: 9, name: 'Back Squat', unit: 'kg' },
        { id: 10, name: 'Front Squat', unit: 'kg' },
        { id: 11, name: 'Overhead Squat', unit: 'kg' },
        { id: 12, name: 'Bench Press', unit: 'kg' },
        { id: 13, name: 'Push Press', unit: 'kg' },
        { id: 14, name: 'Push Jerk', unit: 'kg' },
        { id: 15, name: 'Split Jerk', unit: 'kg' },
        { id: 16, name: 'Pull-Up', unit: 'reps' },
        { id: 17, name: 'Muscle-Up', unit: 'reps' },
        { id: 18, name: 'Double Under', unit: 'reps' },
        { id: 19, name: 'Burpee', unit: 'reps' },
        { id: 20, name: 'Wall Ball', unit: 'reps' },
        { id: 21, name: 'Kettlebell Swing', unit: 'reps' },
        { id: 22, name: 'Handstand Push-Up', unit: 'reps' },
        { id: 23, name: 'Box Jump', unit: 'reps' },
        { id: 24, name: 'Dumbbell Snatch', unit: 'kg' },
        { id: 25, name: 'Dumbbell Clean and Jerk', unit: 'kg' },
        { id: 26, name: 'Clean', unit: 'kg' },

        // ... otros movimientos
    ];

    // Componente para formatear la fecha usando moment
    const FormattedDate = ({ dateTime }) => {
        return <span>{moment(dateTime).format('LL')}</span>;
    };

    // useEffect para inicializar los datos del componente
    useEffect(() => {
        setMovements(movementsList); // Establecer la lista de movimientos
        setFilteredMovements(movementsList); // Inicializar la lista filtrada con todos los movimientos
        fetchUserRecords(); // Llamar a la función para obtener los registros del usuario
    }, []);

    // Función para obtener los registros del usuario desde la API
    const fetchUserRecords = async () => {
        try {
            const token = localStorage.getItem('token'); // Obtener el token de autenticación del localStorage
            const response = await fetch(`${process.env.BACKEND_URL}/api/pr_records/user`, { // Hacer una solicitud GET a la API
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`, // Incluir el token en la cabecera
                    'Content-Type': 'application/json'
                }
            });
            const records = await response.json(); // Parsear la respuesta a JSON
            if (response.ok) { // Si la respuesta es exitosa
                // Filtrar y obtener los últimos registros de cada movimiento
                const latestRecords = records.reduce((acc, record) => {
                    const existingRecord = acc.find(r => r.movement_id === record.movement_id);
                    if (!existingRecord || new Date(record.date) > new Date(existingRecord.date)) {
                        acc = acc.filter(r => r.movement_id !== record.movement_id);
                        acc.push(record);
                    }
                    return acc;
                }, []);
                setUserRecords(latestRecords); // Establecer los registros del usuario
            } else {
                console.error('Error fetching user records'); // Mostrar error en consola si la solicitud falla
            }
        } catch (error) {
            console.error('Error fetching user records:', error); // Mostrar error en consola si ocurre una excepción
        }
    };

    // Función para manejar el cambio de movimiento
    const handleMovementChange = (movementName) => {
        setSelectedMovement(movementName); // Establecer el movimiento seleccionado
        const movement = movements.find(m => m.name === movementName); // Buscar el movimiento en la lista
        if (movement) {
            setUnit(movement.unit); // Establecer la unidad del movimiento
        }
        setShowModal(false); // Cerrar el modal al seleccionar un movimiento
    };

    // Función para manejar el cambio de valor
    const handleValueChange = (e) => {
        setValue(e.target.value); // Establecer el valor ingresado
    };

    // Función para manejar el cambio de tiempo
    const handleTimeChange = (e) => {
        setTime(e.target.value); // Establecer el tiempo ingresado
    };

    // Función para manejar el cambio de peso en kg
    const handleKgChange = (e) => {
        setKg(e.target.value); // Establecer el peso en kg
        setLb((e.target.value * 2.20462).toFixed(2)); // Convertir y establecer el peso en lb
    };

    // Función para manejar el cambio de peso en lb
    const handleLbChange = (e) => {
        setLb(e.target.value); // Establecer el peso en lb
        setKg((e.target.value / 2.20462).toFixed(2)); // Convertir y establecer el peso en kg
    };

    // Función para manejar el envío del formulario
    const handleSubmit = (e) => {
        e.preventDefault(); // Prevenir el comportamiento predeterminado del formulario
        const movement = movements.find(m => m.name === selectedMovement); // Buscar el movimiento seleccionado
        if (!movement || (!value && !time && !kg && !lb)) { // Verificar si no se han ingresado datos
            setShowAlertModal(true); // Mostrar modal de alerta si no hay datos ingresados
            return;
        }
        // Crear un nuevo registro con los datos ingresados
        const newRecord = {
            movement_id: movement.id,
            value: value || null,
            time: time || null,
            kg: kg || null,
            lb: lb || null,
            unit
        };
        saveUserRecord(newRecord); // Guardar el nuevo registro
        // Limpiar los estados del formulario
        setSelectedMovement('');
        setValue('');
        setTime('');
        setKg('');
        setLb('');
        setUnit('');
        setFilteredMovements(movementsList); // Restablecer la lista filtrada
    };

    // Función para guardar el registro del usuario en la base de datos
    const saveUserRecord = async (record) => {
        try {
            const token = localStorage.getItem('token'); // Obtener el token de autenticación del localStorage
            const response = await fetch(`${process.env.BACKEND_URL}/api/pr_records`, { // Hacer una solicitud POST a la API
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`, // Incluir el token en la cabecera
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(record) // Incluir el registro en el cuerpo de la solicitud
            });
            if (response.ok) { // Si la respuesta es exitosa
                const newRecord = await response.json(); // Parsear la respuesta a JSON
                const updatedRecords = [...userRecords]; // Crear una copia de los registros del usuario
                const existingRecordIndex = updatedRecords.findIndex(r => r.movement_id === newRecord.movement_id); // Buscar el índice del registro existente
                if (existingRecordIndex !== -1) {
                    updatedRecords[existingRecordIndex] = newRecord; // Actualizar el registro existente
                } else {
                    updatedRecords.push(newRecord); // Agregar el nuevo registro
                }
                setUserRecords(updatedRecords); // Establecer los registros del usuario
            } else {
                const errorMessage = await response.json(); // Parsear el mensaje de error
                console.error('Error saving user record:', errorMessage.error); // Mostrar error en consola
            }
        } catch (error) {
            console.error('Error saving user record:', error); // Mostrar error en consola si ocurre una excepción
        }
    };

    // Función para manejar la edición de un registro
    const handleEdit = (record) => {
        setSelectedMovement(movements.find(m => m.id === record.movement_id)?.name || ''); // Establecer el movimiento seleccionado
        setValue(record.value || ''); // Establecer el valor del registro
        setTime(record.time || ''); // Establecer el tiempo del registro
        setKg(record.kg || ''); // Establecer el peso en kg del registro
        setLb(record.lb || ''); // Establecer el peso en lb del registro
        setUnit(record.unit || ''); // Establecer la unidad del registro
        setFilteredMovements(movementsList); // Restablecer la lista filtrada
    };

    // Función para manejar el clic en el botón de eliminar
    const handleDeleteClick = (movement_id) => {
        setMovementToDelete(movement_id); // Establecer el movimiento a eliminar
        setShowDeleteModal(true); // Mostrar el modal de confirmación de eliminación
    };

    // Función para confirmar la eliminación de un registro
    const confirmDelete = async () => {
        if (movementToDelete !== null) {
            try {
                const token = localStorage.getItem('token'); // Obtener el token de autenticación del localStorage
                const response = await fetch(`${process.env.BACKEND_URL}/api/pr_records/movement/${movementToDelete}`, { // Hacer una solicitud DELETE a la API
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`, // Incluir el token en la cabecera
                        'Content-Type': 'application/json'
                    }
                });
                if (response.ok) { // Si la respuesta es exitosa
                    setUserRecords(userRecords.filter(r => r.movement_id !== movementToDelete)); // Filtrar los registros del usuario
                    setShowDeleteModal(false); // Ocultar el modal de confirmación de eliminación
                    setMovementToDelete(null); // Limpiar el estado del movimiento a eliminar
                } else {
                    const errorMessage = await response.json(); // Parsear el mensaje de error
                    console.error('Error deleting user records:', errorMessage.error); // Mostrar error en consola
                }
            } catch (error) {
                console.error('Error deleting user records:', error); // Mostrar error en consola si ocurre una excepción
            }
        }
    };

    // Función para cancelar la eliminación de un registro
    const cancelDelete = () => {
        setShowDeleteModal(false); // Ocultar el modal de confirmación de eliminación
        setMovementToDelete(null); // Limpiar el estado del movimiento a eliminar
    };

    useEffect(() => {
        const filtered = movements.filter(movement =>
            movement.name.toLowerCase().includes(search.toLowerCase())
        );
        setFilteredMovements(filtered);
    }, [search, movements]);

    const downloadExcel = () => {
        // Mapea los registros de usuario para incluir el nombre del movimiento en lugar de solo el ID
        const dataToExport = userRecords.map(record => {
            // Encuentra el nombre del movimiento correspondiente al movement_id del registro
            const movementName = movements.find(m => m.id === record.movement_id)?.name || "N/A";
            // Devuelve un nuevo objeto que incluye todos los datos del registro original más el nombre del movimiento
            return {
                ...record,
                movement_name: movementName,
            };
        });

        // Convierte los datos a exportar en una hoja de cálculo utilizando la biblioteca XLSX
        const ws = XLSX.utils.json_to_sheet(dataToExport);

        // Crea un nuevo libro de trabajo (workbook) de Excel
        const wb = XLSX.utils.book_new();

        // Agrega la hoja de cálculo al libro de trabajo con el nombre 'PRrecords'
        XLSX.utils.book_append_sheet(wb, ws, 'PRrecords');

        // Escribe el libro de trabajo en un archivo llamado 'PRrecords.xlsx'
        XLSX.writeFile(wb, 'PRrecords.xlsx');
    };

    // Renderizado del componente
    return (
        <div className={styles.prRecordContainer}>
            <h1 className={styles.titleComponent}>PRrecord</h1>
            <Form className={styles.prRecordForm} onSubmit={handleSubmit}>
                <div className={styles.fieldsRow}>
                    <Form.Group controlId="movement" className={styles.formGroup}>
                        <Form.Label className={styles.formLabel}>Movement</Form.Label>
                        <Form.Control
                            type="text"
                            value={selectedMovement}
                            onClick={() => setShowModal(true)}
                            readOnly
                            placeholder="Select movement"
                            className={styles.formControl}
                        />
                    </Form.Group>

                    {unit === 'kg' && (
                        <Form.Group controlId="kg" className={styles.formGroup}>
                            <Form.Label className={styles.formLabel}>Weight (kg)</Form.Label>
                            <Form.Control
                                type="number"
                                value={kg}
                                onChange={handleKgChange}
                                placeholder="Enter weight in kg"
                                className={styles.formControl}
                            />
                        </Form.Group>
                    )}

                    {unit === 'lb' && (
                        <Form.Group controlId="lb" className={styles.formGroup}>
                            <Form.Label className={styles.formLabel}>Weight (lb)</Form.Label>
                            <Form.Control
                                type="number"
                                value={lb}
                                onChange={handleLbChange}
                                placeholder="Enter weight in lb"
                                className={styles.formControl}
                            />
                        </Form.Group>
                    )}

                    {unit === 'km_min' && (
                        <>
                            <Form.Group controlId="distance" className={styles.formGroup}>
                                <Form.Label className={styles.formLabel}>Distance (km)</Form.Label>
                                <Form.Control
                                    type="number"
                                    value={value}
                                    onChange={handleValueChange}
                                    placeholder="Enter distance in km"
                                    className={styles.formControl}
                                />
                            </Form.Group>
                            <Form.Group controlId="time" className={styles.formGroup}>
                                <Form.Label className={styles.formLabel}>Time (min)</Form.Label>
                                <Form.Control
                                    type="number"
                                    value={time}
                                    onChange={handleTimeChange}
                                    placeholder="Enter time in minutes"
                                    className={styles.formControl}
                                />
                            </Form.Group>
                        </>
                    )}

                    {unit === 'cal_min' && (
                        <>
                            <Form.Group controlId="calories" className={styles.formGroup}>
                                <Form.Label className={styles.formLabel}>Calories (cal)</Form.Label>
                                <Form.Control
                                    type="number"
                                    value={value}
                                    onChange={handleValueChange}
                                    placeholder="Enter calories"
                                    className={styles.formControl}
                                />
                            </Form.Group>
                            <Form.Group controlId="time" className={styles.formGroup}>
                                <Form.Label className={styles.formLabel}>Time (min)</Form.Label>
                                <Form.Control
                                    type="number"
                                    value={time}
                                    onChange={handleTimeChange}
                                    placeholder="Enter time in minutes"
                                    className={styles.formControl}
                                />
                            </Form.Group>
                        </>
                    )}

                    {unit === 'reps' && (
                        <Form.Group controlId="reps" className={styles.formGroup}>
                            <Form.Label className={styles.formLabel}>Repetitions</Form.Label>
                            <Form.Control
                                type="number"
                                value={value}
                                onChange={handleValueChange}
                                placeholder="Enter repetitions"
                                className={styles.formControl}
                            />
                        </Form.Group>
                    )}

                    <Button variant="primary" type="submit" className={styles.formButton}>
                        Save Record
                    </Button>
                </div>
                <Form.Group controlId="searchMovement" className={styles.searchGroup}>
                    <Form.Control
                        type="text"
                        placeholder="Search movements"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className={styles.fullWidthControl}
                    />
                </Form.Group>
                <Button variant="outline-secondary" onClick={downloadExcel} className={styles.buttonExcel} title='Download .xlsx'>
                    <i className="fa-solid fa-file-excel"></i> Download Excel
                </Button>
            </Form>


            <div className={styles.tableContainer}>
                <Table striped bordered hover className={styles.prRecordTable}>
                    <thead>
                        <tr>
                            <th>Movement</th>
                            <th>Value</th>
                            <th>Time (min)</th>
                            <th>Weight (kg)</th>
                            <th>Weight (lb)</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {userRecords.filter(record => filteredMovements.some(m => m.id === record.movement_id)).map(record => (
                            <tr key={record.id}>
                                <td>{movements.find(m => m.id === record.movement_id)?.name || "N/A"}</td>
                                <td>{record.value}</td>
                                <td>{record.time}</td>
                                <td>{record.kg}</td>
                                <td>{record.lb}</td>
                                <td><FormattedDate dateTime={record.date} /></td>
                                <td>
                                    <Button
                                        variant="warning"
                                        onClick={() => handleEdit(record)}
                                        className={styles.actionButtonEdit}
                                        title="Edit"
                                    >
                                        Update
                                    </Button>
                                    <Button
                                        variant="danger"
                                        onClick={() => handleDeleteClick(record.movement_id)}
                                        className={styles.actionButtonDelete}
                                        title="Delete"
                                    >
                                        Delete
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>

            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <div className={styles.modalcontent}>
                    <Modal.Header closeButton>
                        <Modal.Title>Select Movement</Modal.Title>
                    </Modal.Header>
                    <Modal.Body className={styles.modalBody}>
                        {movements.map((movement) => (
                            <Button
                                key={movement.id}
                                variant="outline-primary"
                                onClick={() => handleMovementChange(movement.name)}
                                className={styles.movementButton}
                            >
                                {movement.name}
                            </Button>
                        ))}
                    </Modal.Body>
                </div>
            </Modal>

            <Modal show={showDeleteModal} onHide={cancelDelete} centered>
                <div className={styles.modalcontent}>
                    <Modal.Header>
                        <Modal.Title>Confirm Deletion</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        Are you sure you want to delete all records for this movement? This action cannot be undone.
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={cancelDelete}>
                            Cancel
                        </Button>
                        <Button variant="danger" onClick={confirmDelete}>
                            Delete
                        </Button>
                    </Modal.Footer>
                </div>
            </Modal>

            <Modal show={showAlertModal} onHide={() => setShowAlertModal(false)} centered>
                <div className={styles.modalcontent}>
                    <Modal.Header>
                        <Modal.Title>Alert</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        Please enter data for the selected movement. All fields cannot be empty.
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowAlertModal(false)}>
                            Close
                        </Button>
                    </Modal.Footer>
                </div>
            </Modal>
        </div>
    );
};

export default PRRecord;
