function setToggleIconsEvent(element) {
  element.hover((event) => {
    let td = event.target;
    let id = td.getAttribute("id").match(/_(\d+)$/)[1];
    $(`img[id*="_icon_"]:visible`).hide();

    $(`#edit_icon_${id}`).show();
    $(`#edit_icon_${id}`).parent().css("display", "flex");

    $(`#remove_icon_${id}`).show();
    $(`#remove_icon_${id}`).parent().css("display", "flex");

    $(`tr[person_id="${id}"]`).hover(
      () => {},
      (event) => {
        $("span.iconWrapper:visible").hide();
        $(`img[id*="_icon_"]:visible`).hide();
      }
    );
  }, (event) => {
    let td = event.target;
    let id = td.getAttribute("id").match(/_(\d+)$/)[1];

    let imgIcon = $(`img[id*="_icon_"]:visible`);
    let imgId = imgIcon.attr("id").match(/_(\d+)$/)[1];
    if (imgId != id) {
      imgIcon.hide();
    }
  });
}


function initCancelSubmit(cancelButton, rowBackup, dataIndex) {
  cancelButton.on('click', (event) => {
    let row = $(`tr[person_id="${dataIndex}"]`);
    row.fadeOut();
    setTimeout(() => {
      row.html(rowBackup);
      row.fadeIn();
      setToggleIconsEvent($(`td[id$="${dataIndex}"].personData`));
    }, 500);

  });
}


function initSubmitEdit(button, dbName, dataIndex) {
  button.on('click', (event) => {
    // pegar valor dos inputs
    var nameInput = $(`#name_${dataIndex}`).val();
    var birthDateInput = $(`#birthdate_${dataIndex}`).val();
    // montar personData obj
    var newData = createPersonData(nameInput, birthDateInput);
    if (newData["error"]) {
      displayErrorMessage(newData["message"]);
    } else {
      // fazer o update
      updateDataFromStorage(dbName, dataIndex, newData);

      let currentRow = button.parent().parent().parent();
      if (currentRow.parent().children().length === 1) {
        $("thead").css("display", "block");
      }
      currentRow.hide();
      button.parent().hide();
      let successMessage = `${nameInput} editado com sucesso!`;
      displaySuccessMessage(successMessage, $("#msg"));

      setTimeout(
        () => {
          $("thead").css("display","");
          updateTable($("#dbData tbody") , [dataIndex, newData], dataIndex);

          setToggleIconsEvent($(`td[id$="${dataIndex}"].personData`));
        },
        3000
      );
    }
  });
}


function createEditForm(fieldData) {
  var editForm = "";
  var id = fieldData.getAttribute("id");
  var object = $(`#${id}`);
  id = id.toLowerCase();

  if (id.match(/name/)) {
    editForm += `<td class="tableCell"><input id="${id}" maxlength="120"
           name="name" required type="text" inputmode="text"
           minlength="3" pattern="^([A-zÁ-ú]{3,})(\\s[A-zÁ-ú]+)(\\s[A-zÁ-ú]+)*$"
           autocomplete="name" value="${object.text()}" /></td>`;
  } else if (id.match(/date/)) {
    let regex = /(\d{2})\/(\d{2})\/(\d{4})/;
    let date = object.text().replace(regex, reFormatDate);
    let newDate = new Date(date).toISOString().substring(0, 10);

    editForm += `<td class="tableCell"><input id="${id}" type="date"
                name="birth-date" required inputmode="numeric"
                pattern="^(0[1-9]|1[0-9]|2[0-9]|3[01])\/(0[1-9]|1[012])\/[0-9]{4}$"
                autocomplete="bday" value="${newDate}" /></td>`;
  } else if (id.match(/edit/)) {
    editForm += `<td class="tableCell iconCell"><span class="saveChangesIcon"><img class="icon clickable" title="Salvar" alt="Salvar" src="imgs/confirm_icon.png" id="submit_${id}" type="submit" /></span></td>`;
    editForm += `<td class="tableCell iconCell"><span class="saveChangesIcon"><img class="icon clickable" title="Cancelar" alt="Cancelar" src="imgs/cancel_icon.png" id="cancel_submit_${id}" type="submit" /></span></td>`;
  }

  return editForm;
}


function formatDate(match, year, month, day) {
  return [day, month, year].join("/");
}


function reFormatDate(match, day, month, year) {
  return [year, month, day];
}

function showTable(tableElement) {
  if (tableElement.is(":hidden")) {
    tableElement.fadeIn();
    tableElement.removeClass("hidden");
  }
}


function generateTableRow(tbodyElement, newEntry) {
  /*
    newEntry -> [id, {key: value, key: value}]
  */
  let index = newEntry[0];
  let newData = newEntry[1];
  var tr = `<tr person_id="${index}">`;

  for (key of Object.keys(newData)) {
    if (key === "BirthDate") {
      let regex = /(\d{4})-(\d{2})-(\d{2})/;
      newData[key] = newData[key].replace(regex, formatDate);
    }

    tr += `<td id="${key}_${index}" class="tableCell personData">${newData[key]}</td>`;
  }
  tr += `<td id="edit_${index}" class="tableCell iconCell"><span class="iconWrapper"><img id="edit_icon_${index}" type="edit" title="Editar" alt="Editar" class="icon clickable hidden" src="imgs/edit_icon.png"/></span></td>"`;
  tr += `<td id="remove_${index}" class="tableCell iconCell"><span class="iconWrapper"><img id="remove_icon_${index}" type="remove" title="Remover" alt="Remover" class="icon clickable hidden" src="imgs/remove_icon.png"/></span></td>"`;

  tr += "</tr>";

  return tr;
}


function generateTable(dbName, tbodyElement) {
  // Ler as entradas do localStorage
  let dbEntries = JSON.parse(window.localStorage.getItem(dbName)) || [];
  // Se não houver entradas, nao exibe tabela
  if (dbEntries.length > 0) {
    // Para cada item, gerar uma <tr> com os dados
    var entries = dbEntries.entries();
    for ([index, element] of entries) {
      tbodyElement.prepend(generateTableRow(tbodyElement,[index, element]));
    }

    showTable(tbodyElement.parent());
  }
}


function updateTable(tbodyElement, newEntry, row=null) {
  /*
    newEntry -> [id, {key: value, key: value}]
  */
  var tr = generateTableRow(tbodyElement, newEntry);
  tr = tr.replace("<tr ", '<tr class="hidden"');
  if (row) {
    $(`tr[person_id="${row}"]`).replaceWith(tr);
  } else {
    tbodyElement.prepend(tr);
    showTable(tbodyElement.parent());
  }
  $("tr.hidden").fadeIn("slow");
  $("tr.hidden").removeClass("hidden");
}


function createPersonData(nameInput, birthDateInput) {
  let formatDate = birthDateInput.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (formatDate) {
    birthDateInput = `${formatDate[3]}-${formatDate[2]}-${formatDate[1]}`;
  }

  if (nameInput.length === 0 ) {
    msg = "Campo requerido. Favor inserir o nome completo.";
  } else if (nameInput.length < 3) {
    msg = "Use pelo menos 3 caracteres (no momento está usando"+
      ` apenas ${nameInput.length}).`;
  } else if (nameInput.length > 120) {
    msg = "Nome deve ter no máximo 120 caracteres (no momento está com"+
      ` ${nameInput.length} caracteres).`;
  } else if (/^[aA-zZ]{3,}\s*$/.test(nameInput)) {
    msg = "Inserir o nome completo.";
  } else if (/\s{2,}|(\s$)/.test(nameInput)) {
    msg = "Remova excesso de espaços entre os nomes ou "+
      "espaço em branco ao final do nome.";
  } else if (/\d+/g.test(nameInput)) {
    msg = "Números não são permitidos.";
  } else if (!/(\d{4})-(\d{2})-(\d{2})/.test(birthDateInput)) {
    msg = "Data de nascimento inválida."
  } else {
      return {Name: nameInput, BirthDate: birthDateInput}
  }
  return {error: true, message: msg};
}


function readDb(dbName) {
  return JSON.parse(window.localStorage.getItem(dbName)) || [];
}


function getDataFromStorage(dbName, dataIndex) {
  var dataBase =  readDb(dbName);
  return dataBase[dataIndex];
}


function updateDataFromStorage(dbName, dataIndex, newData) {
  var dataBase = readDb(dbName);
  dataBase[dataIndex] = newData;

  localStorage.setItem(dbName, JSON.stringify(dataBase));

  return newData;
}


function saveDataToStorage(dbName, newData) {
  try {
    var peopleStorage = JSON.parse(window.localStorage.getItem(dbName)) || [];
    if (!Array.isArray(peopleStorage)) { peopleStorage = [peopleStorage] }
    peopleStorage.push(newData);

    localStorage.setItem(dbName, JSON.stringify(peopleStorage));
    return peopleStorage.length-1; // Index of the newData in localStorage
  } catch (error) {
    return error.message;
  }
}

function removeDataFromStorage(dbName, index) {
  console.log(index);
  var dataBase = readDb(dbName);
  dataBase.splice(index, 1);

  localStorage.setItem(dbName, JSON.stringify(dataBase));
}


function displaySuccessMessage(message, messageArea=$("#msg")) {
  messageArea.prepend(message).hide();
  messageArea.attr("class", "success");
  messageArea.slideDown("slow", () => {
    setTimeout(() => {
      messageArea.slideUp("slow", () => messageArea.empty());
    }, 2000)
  });
}

function displayErrorMessage(errorMsg, messageArea=$("#msg")) {
  messageArea.prepend(`${errorMsg}`).hide();
  messageArea.attr("class", "error");
  messageArea.slideDown("slow", () => {
    setTimeout(() => {
      messageArea.slideUp("slow", () => messageArea.empty());
    }, 2000)
  });
}


function validateNameInput(element) {
  if (!element.validity.valid) {
    element.style.setProperty("border-color","var(--invalid-input-border)");
  }
  if (element.validity.patternMismatch || element.validity.valueMissing) {
    let msg = ""
    let name = element.value;
    if (element.value.length < element.getAttribute("minlength")) {
      if (element.validity.valueMissing) {
        msg = "Campo requerido. Favor inserir o nome completo.";
      } else {
        msg = "Use pelo menos 3 caracteres (no momento está usando"+
          ` apenas ${name.length}).`;
      }
    } else if (/^[aA-zZ]{3,}\s*$/.test(name)) {
      msg = "Inserir o nome completo.";
    } else if (/\s{2,}|(\s$)/.test(name)) {
      msg = "Remova excesso de espaços entre os nomes ou "+
        "espaço em branco ao final do nome.";
    } else if (/\d+/g.test(name)) {
      msg = "Números não são permitidos."; }
    element.setCustomValidity(msg);
  }
  else {
    element.setCustomValidity("");
    element.style.setProperty("border-color","var(--input-border)");
  }
}


function validateDateInput(element) {
  let msg = "A data de nascimento precisa estar no formato DD/MM/AAAA,"+
    " por exemplo: 31/01/2021.";
  if (!element.validity.valid) {
    element.style.setProperty("border-color","var(--invalid-input-border)");
  }
  if (element.validity.patternMismatch) {
    element.setCustomValidity(msg);
  }
  else {
    element.setCustomValidity("");
    element.style.setProperty("border-color","var(--input-border)");
  }
}


function validateInput(element) {
  let type = element.getAttribute("name");

  if (type === "name") {
    validateNameInput(element);
  }
  else if (type === "birth-date") {
    validateDateInput(element);
  }
}


function InputValidation(inputElement) {
  inputElement.addEventListener("input", (e) => {
    validateInput(e.target); });
}


window.addEventListener("load", () => {
  var nameInput = document.querySelector("#name");
  InputValidation(nameInput);

  var birthDateInput = document.querySelector("#birth-date");
  InputValidation(birthDateInput);

  var dbKey = "Cadastro de Pessoas";
  generateTable(dbKey, $("#dbData tbody"));

  document.querySelector(".js-form").addEventListener("submit", (event) => {
      event.preventDefault();

      newPerson = createPersonData(nameInput.value, birthDateInput.value);

      let newDataIndex = saveDataToStorage(dbKey, newPerson);
      if (Number.isInteger(newDataIndex)) {
        let successMessage = `${nameInput.value} cadastrado com sucesso!`
        displaySuccessMessage(successMessage, $("#msg"));

        let newData = [newDataIndex, newPerson]
        setTimeout(
          () => {
            updateTable($("#dbData tbody"), newData)
            setToggleIconsEvent($(`td.personData`));
          },
          3000
        );

      } else {
        displayErrorMessage(dataSaved, $("#msg"));
      }

      event.target.reset();
      document.querySelector("button").blur();
  })

  document.querySelector("#dbData tbody").addEventListener("click", (event) => {
    let icon = event.target;
    if (icon && $(icon).hasClass("icon") && $(icon).attr("type") === "edit") {
      let index = icon.getAttribute("id").match(/edit_icon_(\d+)/)[1];

      var editForm = "";
      for (data of $(`tr[person_id="${index}"]`).children()) {
        editForm += createEditForm(data);
      }
      var rowBackup = $(`tr[person_id="${index}"]`).html();
      $(`tr[person_id="${index}"]`).html(editForm);
      $("span.saveChangesIcon").css("display", "flex");
      InputValidation($("#dbData tbody")[0]);

      initSubmitEdit($("img[id^='submit_edit_']"), dbKey, index);
      initCancelSubmit($("img[id^='cancel_submit_edit_']"), rowBackup, index);
    } else if ($(icon).hasClass("icon") && $(icon).attr("type") === "remove") {
      let index = icon.getAttribute("id").match(/remove_icon_(\d+)/)[1];

      let personName = $(`#Name_${index}`).text();
      cxDialog({
        title: 'Confirmar remoção',
        info: `Tem certeza que deseja remover "${personName}" da base de dados?`,
        okText: "Sim, quero remover",
        noText: "Cancelar",
        ok: () => {
          removeDataFromStorage(dbKey, index);

          displaySuccessMessage(`${personName} removido da base de dados.`, $("#msg"));
          setTimeout(
            () => {
              $("#dbData").hide();
              $("#dbData tbody").html("");
              generateTable(dbKey, $("#dbData tbody"));
              setToggleIconsEvent($(`td.personData`));
            },
            3000);
        },
        no: () => {

        }
      });
    }
  });

  setToggleIconsEvent($(`td.personData`));
});
