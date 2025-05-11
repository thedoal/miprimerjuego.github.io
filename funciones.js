//Inicia el contador de tiempo del juego
function iniciarCronometro() {
	// Inicia un temporizador que se ejecuta cada 1 segundo (1000 ms)
	cronometro = setInterval(() => {
		// Aumenta el contador de tiempo global en 1 segundo
		tiempo++;

		// Calcula minutos y segundos con formato de dos dígitos
		let min = String(Math.floor(tiempo / 60)).padStart(2, '0');
		let sec = String(tiempo % 60).padStart(2, '0');

		// Actualiza el elemento del DOM para mostrar el tiempo en pantalla
		document.getElementById('tiempo').textContent = `Tiempo: ${min}:${sec}`;
	}, 1000);
}
//Genera un computador dentro del área de juego
function crearComputador(scene) {
	// Si ya hay un computador activo en pantalla, no se crea otro
	if (computers.countActive(true) > 0) return;

	let x, y, intentos = 0;
	do {
		// Genera coordenadas aleatorias dentro del área de juego
		x = Phaser.Math.Between(offsetX + 50, offsetX + juegoAncho - 50);
		y = Phaser.Math.Between(offsetY + 50, offsetY + juegoAlto - 50);
		intentos++;
		// Evita que el computador aparezca muy cerca del jugador
	} while (
		Phaser.Math.Distance.Between(x, y, player.x, player.y) < 100 && intentos < 20
	);

	// Define el tamaño del computador según el ancho de la pantalla (responsive)
	const escalaComp = window.innerWidth < 900 ? 0.5 : 0.7;

	// Crea el sprite del computador y lo hace aparecer con animación
	const comp = computers.create(x, y, 'computer').setScale(escalaComp).setAlpha(0);
	scene.tweens.add({
		targets: comp,
		alpha: 1, // Aparece de forma gradual
		scale: {
			from: 0.3,
			to: 0.7
		}, // Escalado con efecto
		duration: 300,
		ease: 'Back.Out' // Efecto rebote al finalizar
	});

	// Si no se recolecta en 5 segundos, desaparece y se genera uno nuevo
	scene.time.delayedCall(5000, () => {
		if (comp.active) {
			comp.disableBody(true, true); // Desactiva el sprite
			crearComputador(scene); // Llama recursivamente para generar otro
		}
	});
}
//Dibuja el marco animado alrededor del área de juego
function crearMarcoDecorativo(scene) {
	// Crea un gráfico para el marco oscuro exterior
	let marco = scene.add.graphics();
	marco.lineStyle(12, 0x1f3d1a, 1); // Define el grosor y color del borde
	marco.strokeRect(offsetX - 3, offsetY - 3, juegoAncho + 6, juegoAlto + 6); // Dibuja el rectángulo levemente más grande que el área de juego
	marco.setDepth(1); // Coloca el marco en una capa detrás del contenido jugable

	// Crea un gráfico adicional para el borde brillante superior
	let marcoBrillo = scene.add.graphics();
	marcoBrillo.lineStyle(6, 0xb2f296, 1); // Borde más delgado y color más claro
	marcoBrillo.strokeRect(offsetX, offsetY, juegoAncho, juegoAlto); // Dibuja el rectángulo justo sobre el área de juego
	marcoBrillo.setDepth(2); // Coloca este marco por encima del anterior

	// Anima el brillo del marco con una transición de opacidad cíclica
	scene.tweens.add({
		targets: marcoBrillo,
		alpha: {
			from: 0.4,
			to: 1
		}, // Cambia la opacidad entre 0.4 y 1
		duration: 1000, // Duración de cada ciclo
		yoyo: true, // Repite en reversa
		repeat: -1, // Ciclo infinito
		ease: 'Sine.easeInOut' // Transición suave
	});
}
//Genera obstáculos que caen desde arriba
function crearObstaculos(scene) {
	// Crea un evento que se repite continuamente cada 1.5 segundos
	scene.time.addEvent({
		delay: 1500,
		loop: true,
		callback: () => {
			// Calcula la cantidad de obstáculos según el tiempo y la cantidad de computadores recogidos
			const cantidad = 1 + Math.floor(tiempo / 10) + Math.floor(collected / 2);
			for (let i = 0; i < cantidad; i++) {
				// Genera una posición horizontal aleatoria dentro del área de juego
				const x = Phaser.Math.Between(offsetX + 20, offsetX + juegoAncho - 20);
				// Define la escala según si se está en una pantalla pequeña (móvil) o no
				const escala = window.innerWidth < 900 ? 0.25 : 0.4;
				// Crea un nuevo obstáculo fuera del área visible (parte superior)
				const tool = obstacles.create(x, offsetY - 20, 'tool').setScale(escala);
				// Le da una velocidad hacia abajo, que aumenta con el tiempo para mayor dificultad
				tool.setVelocityY(Phaser.Math.Between(300 + tiempo * 2, 450 + tiempo * 2));
			}
		}
	});
}
//Crea y anima un ratón dorado que otorga una vida
function crearRatonDorado(scene) {
	// Crea un evento que se repite cada 15 segundos
	scene.time.addEvent({
		delay: 15000,
		loop: true,
		callback: () => {
			// Posición aleatoria dentro del área jugable para colocar el ratón
			const x = Phaser.Math.Between(offsetX + 50, offsetX + juegoAncho - 50);
			const y = Phaser.Math.Between(offsetY + 50, offsetY + juegoAlto - 50);

			// Escala del ratón ajustada según el tamaño de pantalla
			const escala = window.innerWidth < 900 ? 0.07 : 0.1;

			// Crea el sprite del ratón dorado con escala inicial y transparente
			const raton = scene.physics.add.sprite(x, y, 'goldenMouse')
				.setScale(escala)
				.setAlpha(0);

			// Aplica animación de entrada: transición de opacidad y leve crecimiento
			scene.tweens.add({
				targets: raton,
				alpha: 1, // Aparece suavemente
				scale: {
					from: 0.07,
					to: 0.11
				}, // Aumenta de tamaño
				duration: 400,
				ease: 'Back.Out' // Suaviza la animación
			});

			// Si no se recoge en 7 segundos, desaparece automáticamente
			scene.time.delayedCall(7000, () => {
				if (raton.active) raton.disableBody(true, true);
			});

			// Define la colisión entre el jugador y el ratón dorado
			scene.physics.add.overlap(player, raton, collectGoldenMouse, null, scene);
		}
	});
}
//Crea un joystick virtual para móviles con pantalla chica
function crearJoystickMovil() {
	// Verifica si la pantalla es pequeña (menor a 900px) y si ya se creó el joystick antes
	if (window.innerWidth >= 900 || window.joystickCreado) return;

	// Obtiene la zona del DOM donde se mostrará el joystick
	const joystickZone = document.getElementById('joystick-zone');

	// Crea el joystick usando la librería nipplejs
	const joystickManager = nipplejs.create({
		zone: joystickZone, // Zona donde se dibuja el joystick
		mode: 'static', // Se mantiene fijo
		color: 'black', // Color del joystick
		position: {
			left: '50%',
			top: '50%'
		}, // Posición dentro del div
		restOpacity: 1 // Opacidad cuando está en reposo
	});

	// Evento cuando el joystick se mueve
	joystickManager.on('move', (evt, data) => {
		const force = Math.min(data.force, 1); // Limita la fuerza máxima del movimiento
		joystickVelocity.x = Math.cos(data.angle.radian) * force; // Calcula componente X
		joystickVelocity.y = Math.sin(data.angle.radian) * force * -1; // Componente Y (invertida)
	});

	// Evento cuando el joystick se suelta (vuelve a estado neutro)
	joystickManager.on('end', () => {
		joystickVelocity = {
			x: 0,
			y: 0
		}; // Detiene el movimiento del jugador
	});

	// Marca que el joystick ya fue creado para no duplicarlo
	window.joystickCreado = true;
}
//Guarda al recolectar un computador
function collectComputer(player, computer) {
	collectSound.play(); //Reproducir sonido de recolección

	computer.disableBody(true, true); //Desactivar y ocultar el computador recolectado

	collected++; //Incrementar el contador de computadores recolectados

	//Actualizar el texto del HUD con la nueva cantidad
	document.getElementById('contador').textContent = `Computadores: ${collected}`;

	//Crear un nuevo computador en la escena
	crearComputador(player.scene);

	//Animación de desaparición con escalado y desvanecido
	this.tweens.add({
		targets: computer,
		scale: {
			from: 0.3,
			to: 0.7
		}, // (opcional, aunque el objeto ya está deshabilitado)
		alpha: {
			from: 1,
			to: 0
		}, // Efecto de desvanecimiento
		duration: 300,
		onComplete: () => computer.disableBody(true, true) // Asegura que quede deshabilitado
	});
}
//Guarda al recolectar un ratón dorado
function collectGoldenMouse(player, mouse) {
	collectSound.play(); //Reproducir sonido de recolección (puede ser el mismo de los computadores)

	mouse.disableBody(true, true); //Desactivar y ocultar el ratón dorado

	vidas++; //Aumentar la cantidad de vidas

	//Actualizar el texto del HUD con las nuevas vidas
	document.getElementById('vidas').textContent = `Vidas: ${vidas}`;

	//Animación de desaparición suave con escalado y desvanecido
	this.tweens.add({
		targets: mouse,
		scale: {
			from: 0.07,
			to: 0.11
		}, // Puede simular una leve explosión antes de desaparecer
		alpha: {
			from: 1,
			to: 0
		}, // Efecto de desvanecimiento
		duration: 300,
		onComplete: () => mouse.disableBody(true, true) // Asegura que no quede visible o activo
	});
}
//Guarda al ser golpeado por un obstáculo
function hitObstacle(player, obstacle) {
	obstacle.disableBody(true, true); //Desactiva y oculta el obstáculo tras el impacto

	hitSound.play(); //Reproduce sonido de golpe

	vidas--; //Resta una vida al jugador

	//Actualiza el HUD con el número actual de vidas
	document.getElementById('vidas').textContent = `Vidas: ${vidas}`;

	//Si ya no quedan vidas, termina el juego
	if (vidas <= 0) {
		clearInterval(cronometro); // Detiene el cronómetro

		const tiempoTexto = document.getElementById('tiempo').textContent.replace('Tiempo: ', '');

		//Guarda en el ranking remoto antes de terminar
		guardarEnRankingRemoto(nombreJugador, tiempoTexto);

		//Muestra mensaje de fin de juego y reinicia tras breve pausa
		setTimeout(() => {
			alert('💥 ¡Te golpearon demasiadas veces!\n\nFin del juego.');
			window.location.reload(); //Reinicia la página para comenzar de nuevo
		}, 300);
	}
}
//Enviar datos del jugador al ranking
function guardarEnRankingRemoto(nombre, tiempo) {
	fetch(API_URL, {
			method: 'POST',
			// Enviar los datos como un string JSON
			body: JSON.stringify({
				nombre,
				tiempo,
				computadores: collected
			})
		})
		.then(response => response.text())
		.then(data => {
			// Muestra la respuesta del servidor en la consola
			console.log("Respuesta del servidor:", data);
		})
		.catch(error => {
			// Muestra cualquier error de la solicitud en la consola
			console.error("Error al enviar al ranking remoto:", error);
		});
}
//Obtener y mostrar el ranking actualizado
function mostrarRankingRemoto() {
	fetch(API_URL)
		.then(res => res.json())
		.then(data => {
			// Selecciona el contenedor de la lista de ranking en el DOM
			const lista = document.getElementById('lista-ranking');
			lista.innerHTML = ''; // Limpia el contenido anterior

			// Recorre las primeras 5 filas del ranking recibido
			data.slice(0, 5).forEach((fila, i) => {
				const li = document.createElement('li');
				// Agrega el texto con nombre, tiempo y cantidad de computadores recolectados
				li.textContent = `${i + 1}. ${fila[0]} - ${fila[1]} - Comp: ${fila[2]}`;
				lista.appendChild(li);
			});
		});
}
