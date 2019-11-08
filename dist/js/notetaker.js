const $tbody = $("#nt-tbody");
const { del, get, keys, set, Store } = idbKeyval;
const noteStore = new idbKeyval.Store("noteTakingDB", "noteTakingTable");
const $modal = $("#nt-modal");
const $modalHeadder = $("#nt-modal-headder");

//listener for new note creation
const noteapp = {
  active: null,
  edit: function(id) {
    get(parseFloat(id), noteStore).then(function(props) {
      $modal.modal("toggle");
      $modalHeadder.text(`Note: ${new Date(parseFloat(id)).toLocaleString()}`);
      document.getElementById("nt-title").value = props.title;
      document.getElementById("nt-note").value = props.description;
      noteapp.active = parseFloat(id);
    });
  },

  //delete note function
  delete: function(id) {
    del(parseFloat(id), noteStore).then(function() {
      $tbody[0].removeChild(document.getElementById(`${id}`));
    });
  }
};

function Row({ description, id, title, index }) {
  return (
    "<tr>" +
    `<tr id='${id}'>` +
    `<th scope="row">${index + 1}</th>` +
    `<td>${title}</td>` +
    `<td>${description}</td>` +
    "<td>" +
    `<button type='button' class='btn btn-primary btn-block' onclick="noteapp.edit('${id}')" >Edit</button>` +
    `<button type='button' class='btn btn-danger btn-block' onclick="noteapp.delete('${id}')">Delete</button>` +
    "</td>" +
    "</tr>"
  );
}

$modal.on("show.bs.modal", function() {
  $modalHeadder.text("Create a New Note");
});

//Listener for new note creation, intercept before submity
window.addEventListener("load", function() {
  //when page is loaded grab noted from last 2 days and build table
  keys(noteStore).then(function(keyarr) {
    const twodays = new Date().getTime() - 60 * 60 * 1000 * 48;
    const ids = keyarr.filter(function(time) {
      return time > twodays;
    });
    //Reduce notes to < 2 days and get all corresponding notes
    var np = ids.map(function(time) {
      return get(time, noteStore);
    });

    //wait until all promises are resolved
    Promise.all(np)
      .then(function(data) {
        data.forEach(function(props, index) {
          var id = $tbody.append(Row({ ...props, id: ids[index], index }));
        });
      })
      .catch(console.log);
  });

  //when form is submitted do this
  document.getElementById("nt-form").addEventListener("submit", function(e) {
    e.preventDefault();
    var formData = new FormData(e.target);
    var note = {
      description: formData.get("note"),
      title: formData.get("title")
    };
    const newTime = noteapp.active || new Date().getTime();
    set(newTime, note, noteStore).then(function() {
      $modal.modal("toggle");
      var BuiltRow = Row({
        ...note,
        id: newTime,
        index: $tbody.children().length + 1
      });
      noteapp.active
        ? ($tbody.find(`#${newTime}`)[0].outerHTML = BuiltRow)
        : $tbody.append(BuiltRow);
      noteapp.active = null;
    });
  });
});
