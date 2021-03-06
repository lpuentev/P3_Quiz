
const Sequelize = require('sequelize');
const {log, biglog, errorlog, colorize} = require("./out");

const {models} = require('./model');


/**
* Muestra la ayuda.
*
* @param rl Objeto readline usado para implementar el CLI.
*/
exports.helpCmd = rl => {
  log("Commandos:");
      log(" h|help - Muestra esta ayuda.");
      log(" list - Listar los quizzes existentes.");
      log(" show <id> - Muestra la pregunta y la respuesta el quiz indicado.");
      log(" add - Añadir un nuevo quiz interactivamente.");
      log(" delete <id> - Borrar el quiz indicado.");
      log(" edit <id> - Editar el quiz indicado.");
      log(" test <id> - Probar el quiz indicado.");
      log(" p|play - Jugar a preguntar aleatoriamente todos los quizzes.");
      log(" credits - Créditos.");
      log(" q|quit - Salir del programa.");
      rl.prompt();
};

/**
* Lista todos los quizzes existentes en el modelo.
*
* @param rl Objeto readline usado para implementar el CLI.
*/
exports.listCmd = rl => {
    models.quiz.findAll()
    .each(quiz => {
        log(` [${colorize(quiz.id, 'magenta')}]:  ${quiz.question}`);
    })
    .catch(error => {
      errorlog(error.message);
    })
    .then(() => {
      rl.prompt();
    });
};

/**
* Esta funcion devuelve una promesa que:
*   - Valida que se ha introducido un valor para el parametro.
*   - Convierte el parametro en un numero entero.
* Si todo va bien, la promesa se satisface y devuelve el valor de id a usar.
*/
const validateId = id => {
  
  return new Sequelize.Promise((resolve, reject) => {
    if (typeof id === "undefined") {
      reject(new Error(`Falta el parametro <id>.`));
    } else {
      id = parseInt(id);
      if(Number.isNaN(id)) {
        reject(new Error(`El valor del parámetro <id> no es un número.`));
      } else {
        resolve(id);
      }
    }
  });
};


/**
* Muestra el quiz indicado en el parámetro: la pregunta y la respuesta.
*
* @param id Clave del quiz a mostrar.
*/
exports.showCmd = (rl, id) => {
  validateId(id)
  .then(id => models.quiz.findById(id))
  .then(quiz => {
    if(!quiz) {
      throw new Error(`No existe un quiz asociado al id=${id}.`);
    }
    log(` [${colorize(quiz.id,'magenta')}]:  ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);

  })
  .catch(error => {
    errorlog(error.message);
  })
  .then(() => {
    rl.prompt();
  });
};


/**
* Esta función devuelve una promesa que cuando se cumple, proporciona el texto introducido
* Entonces la llamada a then que hay que hacer la promesa devuelta sera:
*     .then(answer => {...})
* También colorea en rojo el texto de la pregunta, elimina espacios al principio y final
*
* @param rl Objeto readline usado para implementar el CLI.
* @param text Pregunta que hay que hacerle al usuario.
*/
const makeQuestion = (rl, text) => {

  return new Sequelize.Promise((resolve, reject) => {
    rl.question(colorize(text, 'red'), answer => {
      resolve(answer.trim());
    });
  });
};

/**
* Añade un nuevo quiz al modelo.
* Pregunta interactivamente por la pregunta y por la respuesta.
*/
exports.addCmd = rl => {
  makeQuestion(rl, ' Introduzca una pregunta: ')
  .then(q => {
    return makeQuestion(rl, ' Introduzca la respuesta ')
    .then(a => {
    return {question: q, answer: a};
    });
  })
  .then(quiz => {
    return models.quiz.create(quiz);
  })
  .then((quiz) => {
          log(` ${colorize('Se ha añadido', 'magenta')}: ${question} ${colorize('=>', 'magenta')} ${answer}`);

  })
  .catch(Sequelize.ValidationError, error => {
    errorlog('El quiz es erroneo:');
    error.errors.forEach(({message}) => errorlog(message));
  })
  .catch(error => {
    errorlog(error.message);
  })
  .then(() => {
    rel.prompt();
  });

};

/**
* Borra un quiz del modelo.
*
* @param id Clave del quiz a borrar en el modelo.
*/
exports.deleteCmd = (rl, id) => {
  validateId(id)
  .then(id => models.quiz.destroy({where: {id}}))
  .catch(error => {
    errorlog(error.message);
  })
  .then(() => {
    rl.prompt();
  });
};

/**
* Edita un quiz del modelo.
* 
* @param id Clave del quiz a editar en el modelo.
*/
exports.editCmd = (rl, id) => {
  validateId(id)
  .then(id => models.quiz.findById(id))
  .then(quiz => {
    if(!quiz) {
      throw new Error(`No existe un quiz asociado al id=${id}.`);
    }

    process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)}, 0);
    return makeQuestion(rl, ' Introduzca la pregunta: ')
    .then(q => {
      process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)}, 0);
      return makeQuestion(rl, ' Introduzca la respuesta ')
      .then(a => {
        quiz.question = q;
        quiz.answer = a;
        return quiz;
      });
    });
  })
  .then(quiz => {
    return quiz.save();
  })
  .then(quiz => {
  log(` Se ha cambiado el quiz ${colorize(id, 'magenta')} por: ${question} ${colorize('=>', 'magenta')} ${answer}`);  
  
  })
  .catch(Sequelize.ValidationError, error => {
    errorlog('El quiz es erroneo:');
    error.errors.forEach(({message}) => errorlog(message));
  })
  .catch(error => {
    errorlog(error.message);
  })
  .then(() => {
    rl.prompt();
  });

};

    

/**
* Prueba un quiz, es decir, hace una pregunta del modelo a la que debemos contestar.
* 
* @param id Clave del quiz a probar.
*/

exports.testCmd = (rl, id) => {
  validateId(id)
  .then(id => models.quiz.findById(id))
  .then(quiz => {
    if(!quiz) {
      throw new Error(`No existe un quiz asociado al id=${id}.`);
    }

    return makeQuestion(rl, colorize(quiz.question + '? ', 'red'))
      .then(a => {
        if(normalize(quiz.answer) === normalize(a)){
          log(` Correcto `);
        } else {
          log(` Incorrecto `);
        }
      });
    
  })
  .catch(error => {
    errorlog(error.message);
  })
  .then(() => {
    rl.prompt();
  });

};



/**
* Pregunta todos los quizzes existentes en el modelo en orden aleatorio.
* Se gana si se contesta a todos satisfactoriamente.
*/
exports.playCmd = rl => {

  let score = 0;
  let toBeResolved = [];
  const playOne = () => {
    if (toBeResolved.length === 0) {
    log('No hay nada mas que preguntar.');
    log('Fin del examen. Aciertos: ' + score);
    biglog(score,'magenta');
    rl.prompt();

      } else {

    let id = Math.round(Math.random()*(toBeResolved.length-1));
    let idQuiz = toBeResolved[id];
    toBeResolved.splice(id,1);
    
    models.quiz.findById(idQuiz)

    .then(quiz => {
      return makeQuestion(rl,quiz.question + " ? ")
      .then(a => {

      if(normalize(quiz.answer) === normalize(a)) {
        score++;
        log('CORRECTO - Lleva ' + score + ' aciertos.');
        playOne();

      } else {        
        log(`INCORRECTO.`);
            log(`Fin del juego. Aciertos: ` + score);
            biglog(score, 'magenta');
        rl.prompt();


      }

    });

    })
    .catch(error => {
    errorlog(error.message);
    });
  }
  };

  models.quiz.findAll()
  .each( quiz => {
    toBeResolved.push(quiz.id);
  })
  .then(() => {
    playOne();
  })
  .catch(error => {
    errorlog("Error en array:" + error.message);
  });
};


/**
* Muestra los nombres de los autores de la práctica.
*/
exports.creditsCmd = rl => {
  log('Autores de la práctica:');
    log('LUIS', 'green');
    rl.prompt();
};

/**
* Terminar el programa.
*/
exports.quitCmd = rl => {
  rl.close();
};


/**
* Normaliza un string para que salga en minúsculas sin espacios ni carácteres raros.
*
* Source: http://www.etnassoft.com/2011/03/03/eliminar-tildes-con-javascript/
*
*/
var normalize = (function() {
  var from = "ÃÀÁÄÂÈÉËÊÌÍÏÎÒÓÖÔÙÚÜÛãàáäâèéëêìíïîòóöôùúüûÑñÇç", 
      to   = "AAAAAEEEEIIIIOOOOUUUUaaaaaeeeeiiiioooouuuunncc",
      mapping = {};
 
  for(var i = 0, j = from.length; i < j; i++ )
      mapping[ from.charAt( i ) ] = to.charAt( i );
 
  return function( str ) {

      var ret = [];
      for( var i = 0, j = str.length; i < j; i++ ) {
          var c = str.charAt( i );
          if( mapping.hasOwnProperty( str.charAt( i ) ) )
              ret.push( mapping[ c ] );
          else
              ret.push( c );
      }      
      return ret.join( '' ).replace( /[^-A-Za-z0-9]+/g, '' ).toLowerCase();;
  }
 
})();