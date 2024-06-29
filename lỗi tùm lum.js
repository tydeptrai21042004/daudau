// Initialize fabric canvas
var canvas = new fabric.Canvas('imageCanvas');
var currentNumber = 1;
var annotationMap = {};  // Keep track of annotations
var images = [];  // Track loaded images
var drawingMode = null;  // Track the current drawing mode
var customShape = { path: [] };  // Store custom shape path
var deletedImageUrls = new Set();

canvas.on('mouse:down', function(o) {
    images.forEach(function(img) {
        img.sendToBack();
    });
});

function uploadImage() {
    document.getElementById('file').click();
}

// Event listeners for buttons
document.getElementById('imageLoader').addEventListener('change', handleImage, false);
document.getElementById('drawLine').addEventListener('click', () => setDrawingMode('line'));
document.getElementById('drawCircle').addEventListener('click', () => setDrawingMode('circle'));
document.getElementById('drawArrow').addEventListener('click', () => setDrawingMode('arrow'));
document.getElementById('drawRectangle').addEventListener('click', () => setDrawingMode('rectangle'));
document.getElementById('drawCustomShape').addEventListener('click', () => setDrawingMode('customShape'));
document.getElementById('deleteAnnotation').addEventListener('click', deleteSelected);
document.getElementById('zoomIn').addEventListener('click', zoomIn);
document.getElementById('zoomOut').addEventListener('click', zoomOut);

// tạo table từ Id 
var table = document.getElementById('annotationTable');

table.addEventListener('click', function(event) {
    // Deselect any active object on canvas
    canvas.discardActiveObject();
    canvas.renderAll();
});

document.addEventListener('keydown', function(event) {
    if (event.key === 'l') {
        setDrawingMode('line');
    } else if (event.key === 'c') {
        setDrawingMode('circle');
    } else if (event.key === 'a') {
        setDrawingMode('arrow');
    } else if (event.key === 'r') {
        setDrawingMode('rectangle');
    } else if (event.key === 's') {
        setDrawingMode('customShape');
    } else if (event.key === 'd' || event.key === 'Backspace') {
        deleteSelected();
    } else if (event.key === '+') {
        zoomIn();
    } else if (event.key === '-') {
        zoomOut();
    } else if (event.key === 'e') {
        removeEmptyRows();
    } 
});
// Define an array of colors
var colors = ['white','black','red', 'blue', 'green', 'yellow', 'purple']; // màu cho đường
var colorsfill = ['white','black','red', 'blue', 'green', 'yellow', 'purple','']; // màu cho phần phía trong
var colorIndex = 0; // Chỉ số index của mảng
// short cut của việc tô màu
document.addEventListener('keydown', function(event) {
    if (event.key === 'b') {
        changeColorstroke('stroke');
    } else if (event.key === 't') {
        changeColorfill('fill');
    }
});
function changeColorstroke(property) {
    var activeObject = canvas.getActiveObject();
    if (activeObject) {
        console.log('Active Object:', activeObject);
        var shapeType = getShapeType(activeObject);
        if (shapeType) {
            switch (shapeType) {                
                case 'arrow':
                    console.log('Shape Type:', shapeType); // Check the shape type in console
                    changeColorstrokearrow();
                    break;
                case 'line':    
                case 'rectangle':
                    activeObject.set({ stroke: colors[colorIndex] });
                    break;
                case 'circle':
                case 'customShape':
                    activeObject.set({ stroke: colors[colorIndex] });
                    break;
                default:
                    break;
            }
            canvas.renderAll();
            // Increment colorIndex and wrap around if exceeding array length
            colorIndex = (colorIndex + 1) % colors.length;
        }
    }
}
function changeColorstrokearrow() {
    var activeObject = canvas.getActiveObject();
    if (activeObject && getShapeType(activeObject) === 'arrow') {
        // Assuming the arrow is a group containing lines, change stroke color for each line
        activeObject.getObjects().forEach(function(obj) {
            if (obj.type === 'line') {
                obj.set({ stroke: colors[colorIndex] });
            }
        });
        canvas.renderAll();
    }
}


function changeColorfill(property) {
    var activeObject = canvas.getActiveObject();
    if (activeObject) {
        var shapeType = getShapeType(activeObject);
        if (shapeType) {
            switch (shapeType) {
                case 'line':
                case 'arrow':
                case 'rectangle':
                    activeObject.set({ fill: colorsfill[colorIndex] });
                    break;
                case 'circle':
                case 'customShape':
                    activeObject.set({ fill: colorsfill[colorIndex] });
                    break;
                default:
                    break;
            }
            canvas.renderAll();
            // Increment colorIndex and wrap around if exceeding array length
            colorIndex = (colorIndex + 1) % colorsfill.length;
        }
    }
}
// Function to determine the type of shape (line, circle, arrow, rectangle, customShape)
function getShapeType(object) {
    if (object instanceof fabric.Line) {
        return 'line';
    } else if (object instanceof fabric.Circle) {
        return 'circle';
    } else if (object instanceof fabric.Path) {
        // Assuming customShape is a fabric.Path
        return 'customShape';
    } else if (object instanceof fabric.Rect) {
        return 'rectangle';
    } else if (object.type === 'group' && object._objects.length > 0) {
        // Check if it's an arrow (group containing lines)
        var firstChild = object._objects[0];
        if (firstChild instanceof fabric.Line) {
            return 'arrow';
        }
    }
    return null;
}

// Function to handle image upload
var imageObjects = []; // Global variable to store the current image object

//document.getElementById('imageLoader').addEventListener('change', handleImageUpload, false);
//var imageObjects = []; // Array to store image objects
var imageUrls = new Map(); // Map to store image URLs

function handleImage(e) {
    var files = e.target.files;
    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        var reader = new FileReader();
        reader.onload = function(event) {
            if (!deletedImageUrls.has(event.target.result)) {
                var imgObj = new Image();
                imgObj.src = event.target.result;
                imgObj.onload = function() {
                    var image = new fabric.Image(imgObj);
                    image.scaleToWidth(canvas.getWidth());
                    canvas.add(image);
                    imageObjects.push(image);
                    imageUrls.set(image, event.target.result);
                    canvas.renderAll();
                    e.target.value = '';
                };
            }
        };
        reader.readAsDataURL(file);
    }
}

// Function to send images to back and make them non-selectable
function sendImagesToBack() {
    imageObjects.forEach(function(image) {
        image.set({
            selectable: true,
            evented: true // Make image non-evented to prevent accidental movements
        });
        canvas.sendToBack(image);
    });
    canvas.renderAll();
}

// Track mouse clicks on the canvas
canvas.on('mouse:down', function(o) {
    var pointer = canvas.getPointer(o.e);
    var clickedObject = canvas.findTarget(o.e);

    if (!clickedObject || clickedObject.type !== 'image') {
        sendImagesToBack();
    }
    else {
        bringImagesfromBack();
    }
});
function bringImagesfromBack() {
    if (!canvas || imageObjects.length === 0) {
        console.error("Canvas not initialized or no image objects available.");
        return;
    }

    try {
        imageObjects.forEach(function(image) {
            console.log("Bringing image to front");
            image.set({
                selectable: true,
                evented: true // Make image evented to allow interactions
            });
            canvas.bringToFront(image);
        });
        canvas.renderAll();
    } catch (error) {
        console.error("Error in bringImagesfromBack:", error);
    }
}
// Track mouse clicks on the canvas
canvas.on('mouse:down', function(o) {
    var pointer = canvas.getPointer(o.e);
    var clickedObject = canvas.findTarget(o.e);

    if (clickedObject.type == 'image') {
        bringImagesfromBack();
    }
});

// Disable image selection and movement when in drawing mode
canvas.on('object:modified', function(event) {
    if (drawingMode) {
        var activeObject = event.target;
        if (activeObject && activeObject.type === 'image') {
            activeObject.set({
                selectable: false,
                evented: false
            });
            canvas.renderAll();
        }
    }
});

// Event listener for 'Delete' key press
document.addEventListener('keydown', function(event) {
    if (event.key === 'Delete') {
        console.log('Delete key pressed. Deleting image and shapes...');
        deleteImageAndShapes(); // Call the function
    }
});
function deleteImageAndShapes() {
    // Remove all image objects from the canvas
    if (imageObjects.length > 0) {
        imageObjects.forEach(function(imageObject) {
            canvas.remove(imageObject);
        });
        imageObjects = []; // Clear the array of image objects
    } else {
        console.warn('No image objects found to delete.');
    }

    // Remove all shapes from the canvas
    var objectsToRemove = [];
    canvas.getObjects().forEach(obj => {
        if (obj.type !== 'image') {
            objectsToRemove.push(obj);
        }
    });

    objectsToRemove.forEach(obj => {
        canvas.remove(obj);
    });

    // Clear any associated data or arrays tracking shapes (optional)
    clearAnnotationData(); // Example function to clear associated data

    // Update your UI or perform any other necessary actions
    canvas.renderAll(); // Render the canvas after removal

    // Delete all rows from the table
    deleteAllTableRows(); // Call function to delete all table rows
}
function clearAnnotationData() {
    // Implement your logic to clear any associated data here
    annotationMap = {}; // Clear the annotation map or any other data structures
    // Other cleanup tasks specific to your application
}

function deleteAllTableRows() {
    // Replace 'your-table-id' with your actual table ID
    var table = document.getElementById('annotationTable');

    if (table) {
        // Remove all rows except the header row
        while (table.rows.length > 1) {
            table.deleteRow(1); // Start deleting from index 1 (first row after header)
        }
    } else {
        console.warn('Table not found.');
    }
}



// Assuming you have a key listener or a button click event to trigger this function

// Function to copy selected object
function copy() {
    canvas.getActiveObject().clone(function(cloned) {
        _clipboard = cloned;
    });
}

// Function to paste copied object
function paste() {
    if (_clipboard) {
        _clipboard.clone(function(clonedObj) {
            canvas.discardActiveObject();
            clonedObj.set({
                left: clonedObj.left + 10, // Adjust paste position as needed
                top: clonedObj.top + 10,
                evented: true,
            });
            if (clonedObj.type === 'activeSelection') {
                // active selection needs a reference to the canvas.
                clonedObj.canvas = canvas;
                clonedObj.forEachObject(function(obj) {
                    canvas.add(obj);
                });
                clonedObj.setCoords();
            } else {
                canvas.add(clonedObj);
            }
            addNewAnnotation(clonedObj);
            _clipboard.top += 10;
            _clipboard.left += 10;
            canvas.setActiveObject(clonedObj);
            canvas.requestRenderAll();
        });
    }
}

// Event listener for copying (Ctrl+C or Command+C)
document.addEventListener('keydown', function(event) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
        copy();
    }
});

// Event listener for pasting (Ctrl+V or Command+V)
document.addEventListener('keydown', function(event) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
        paste();
    }
});

// Function to set drawing mode
function setDrawingMode(mode) {
    drawingMode = mode;
    customShape = new fabric.Path(''); // Reset custom shape path
    if (mode) {
        lockImages(true);  // Lock image movement during drawing
    } else {
        lockImages(false);  // Unlock image movement
    }
    resetCanvasListeners();
}

// Function to draw lines
function drawLine() {
    var line, isDown;

    canvas.on('mouse:down', function(o) {
        if (drawingMode !== 'line') return;
        var pointer = canvas.getPointer(o.e);
        var target = canvas.findTarget(o.e);
        
        if (target && target.type === 'image') {
            // Clicked on an image, do not create a line or send annotations to the back
            return;
        }
        isDown = true;
        //var pointer = canvas.getPointer(o.e);
        var points = [pointer.x, pointer.y, pointer.x, pointer.y];
        line = new fabric.Line(points, {
            strokeWidth: 2,
            fill: 'red',
            stroke: 'red',
            originX: 'center',
            originY: 'center',
            selectable: true
        });
        canvas.add(line);
        line.bringToFront();
    });

    canvas.on('mouse:move', function(o) {
        if (!isDown || drawingMode !== 'line') return;
        var pointer = canvas.getPointer(o.e);
        line.set({ x2: pointer.x, y2: pointer.y });
        canvas.renderAll();
    });

    canvas.on('mouse:up', function(o) {
        if (!isDown || drawingMode !== 'line') return;
        isDown = false;
        currentNumber = getLargestNumber() + 1;
        addAnnotationRow(currentNumber);
        addNumberLabel(currentNumber, line);
        annotationMap[currentNumber] = line;
        setDrawingMode(null);
    });
}

function addNewAnnotation(object) {
    var newNumber = getLargestNumber() + 1;
    addAnnotationRow(newNumber);
    addNumberLabel(newNumber, object);
    annotationMap[newNumber] = object;
    setDrawingMode(null);
}

function drawArrow() {
    var arrow, arrowHead1, arrowHead2, isDown, startX, startY;

    canvas.on('mouse:down', function(o) {
        if (drawingMode !== 'arrow') return;
        isDown = true;
        var pointer = canvas.getPointer(o.e);
        startX = pointer.x;
        startY = pointer.y;
        arrow = new fabric.Line([startX, startY, startX, startY], {
            strokeWidth: 2,
            fill: 'red',
            stroke: 'red',
            selectable: true,
            originX: 'center',
            originY: 'center'
        });
        canvas.add(arrow);
    });

    canvas.on('mouse:move', function(o) {
        if (!isDown || drawingMode !== 'arrow') return;
        var pointer = canvas.getPointer(o.e);
        arrow.set({ x2: pointer.x, y2: pointer.y });
        canvas.renderAll();
    });

    canvas.on('mouse:up', function(o) {
        if (!isDown || drawingMode !== 'arrow') return;
        isDown = false;

        // Add arrowhead
        var endX = arrow.x2;
        var endY = arrow.y2;
        var angle = Math.atan2(endY - startY, endX - startX);
        var headLength = 10;

        arrowHead1 = new fabric.Line([
            endX,
            endY,
            endX - headLength * Math.cos(angle - Math.PI / 6),
            endY - headLength * Math.sin(angle - Math.PI / 6)
        ], {
            strokeWidth: 2,
            fill: 'red',
            stroke: 'red',
            selectable: true,
            originX: 'center',
            originY: 'center'
        });

        arrowHead2 = new fabric.Line([
            endX,
            endY,
            endX - headLength * Math.cos(angle + Math.PI / 6),
            endY - headLength * Math.sin(angle + Math.PI / 6)
        ], {
            strokeWidth: 2,
            fill: 'red',
            stroke: 'red',
            selectable: true,
            originX: 'center',
            originY: 'center'
        });

        var arrowGroup = new fabric.Group([arrow, arrowHead1, arrowHead2], {
            selectable: true,
            originX: 'center',
            originY: 'center'
        });

        canvas.add(arrowGroup);
        canvas.remove(arrow);
        canvas.remove(arrowHead1);
        canvas.remove(arrowHead2);

        currentNumber = getLargestNumber() + 1;
        addAnnotationRow(currentNumber);
        addNumberLabel(currentNumber, arrowGroup);
        annotationMap[currentNumber] = arrowGroup;
        setDrawingMode(null);
    });
}



// Function to draw circles
function drawCircle() {
    var circle, isDown;

    canvas.on('mouse:down', function(o) {
        if (drawingMode !== 'circle') return;
        isDown = true;
        var pointer = canvas.getPointer(o.e);
        circle = new fabric.Circle({
            left: pointer.x,
            top: pointer.y,
            originX: 'center',
            originY: 'center',
            radius: 1,
            fill: 'rgba(0,0,0,0)',
            stroke: 'red',
            strokeWidth: 2,
            selectable: true
        });
        canvas.add(circle);
        circle.bringToFront();
    });

    canvas.on('mouse:move', function(o) {
        if (!isDown || drawingMode !== 'circle') return;
        var pointer = canvas.getPointer(o.e);
        var radius = Math.sqrt(Math.pow(circle.left - pointer.x, 2) + Math.pow(circle.top - pointer.y, 2));
        circle.set({ radius: radius });
        canvas.renderAll();
    });

    canvas.on('mouse:up', function(o) {
        if (!isDown || drawingMode !== 'circle') return;
        isDown = false;
        currentNumber = getLargestNumber() + 1;
        addAnnotationRow(currentNumber);
        addNumberLabel(currentNumber, circle);
        annotationMap[currentNumber] = circle;
        setDrawingMode(null);
    });
}

// Function to draw rectangles
function drawRectangle() {
    var rect, isDown, origX, origY;

    canvas.on('mouse:down', function(o) {
        if (drawingMode !== 'rectangle') return;
        isDown = true;
        var pointer = canvas.getPointer(o.e);
        origX = pointer.x;
        origY = pointer.y;
        rect = new fabric.Rect({
            left: origX,
            top: origY,
            originX: 'left',
            originY: 'top',
            width: pointer.x - origX,
            height: pointer.y - origY,
            angle: 0,
            fill: 'rgba(0,0,0,0)',
            stroke: 'red',
            strokeWidth: 2,
            selectable: true
        });
        canvas.add(rect);
        rect.bringToFront();
    });

    canvas.on('mouse:move', function(o) {
        if (!isDown || drawingMode !== 'rectangle') return;
        var pointer = canvas.getPointer(o.e);

        if (origX > pointer.x) {
            rect.set({ left: Math.abs(pointer.x) });
        }
        if (origY > pointer.y) {
            rect.set({ top: Math.abs(pointer.y) });
        }

        rect.set({ width: Math.abs(origX - pointer.x) });
        rect.set({ height: Math.abs(origY - pointer.y) });

        canvas.renderAll();
    });

    canvas.on('mouse:up', function(o) {
        if (!isDown || drawingMode !== 'rectangle') return;
        isDown = false;
        currentNumber = getLargestNumber() + 1;
        addAnnotationRow(currentNumber);
        addNumberLabel(currentNumber, rect);
        annotationMap[currentNumber] = rect;
        setDrawingMode(null);
    });
}

function drawCustomShape() {
    var isDrawing = false;
    var path = [];

    canvas.on('mouse:down', function(o) {
        if (drawingMode !== 'customShape') return;
        isDrawing = true;
        var pointer = canvas.getPointer(o.e);
        path = [['M', pointer.x, pointer.y]];
    });

    canvas.on('mouse:move', function(o) {
        if (!isDrawing || drawingMode !== 'customShape') return;
        var pointer = canvas.getPointer(o.e);
        path.push(['L', pointer.x, pointer.y]);

        // Clear temporary path if it exists
        if (canvas.tempPath) {
            canvas.remove(canvas.tempPath);
        }

        // Create a new temporary path
        canvas.tempPath = new fabric.Path(path, {
            stroke: 'red',
            fill: 'rgba(0,0,0,0)',
            strokeWidth: 2,
            selectable: false,
            evented: false
        });

        canvas.add(canvas.tempPath);
        canvas.renderAll();
    });

    canvas.on('mouse:up', function(o) {
        if (!isDrawing || drawingMode !== 'customShape') return;
        isDrawing = false;

        // Create the final path from the collected points
        customShape = new fabric.Path(path, {
            stroke: 'red',
            fill: 'rgba(0,0,0,0)',
            strokeWidth: 2,
            selectable: true
        });

        canvas.add(customShape);
        canvas.remove(canvas.tempPath); // Remove the temporary path
        canvas.tempPath = null; // Reset temporary path

        currentNumber = getLargestNumber() + 1;
        addAnnotationRow(currentNumber);
        addNumberLabel(currentNumber, customShape);
        annotationMap[currentNumber] = customShape;
        setDrawingMode(null);
    });
}


var deletedObjects = [];
//var imageUrls = new Map(); // Assuming you store image URLs in a Map with image object as the key
var deletedObjects = [];

function deleteSelected() {
    var activeObjects = canvas.getActiveObjects();
    if (activeObjects.length === 0) {
        console.log("No active objects selected.");
        return; // Exit the function if no objects are selected
    }

    activeObjects.forEach(function(activeObject) {
        if (activeObject.type === 'image') {
            // Remove the image object from the canvas
            canvas.remove(activeObject);

            // Remove the URL associated with the image object
            var imageUrl = imageUrls.get(activeObject);
            if (imageUrl) {
                imageUrls.delete(activeObject);
                // Add the URL of the deleted image to the set of deleted images
                deletedImageUrls.add(imageUrl);
            }

            // Remove the image from the imageObjects array
            var index = imageObjects.indexOf(activeObject);
            if (index !== -1) {
                imageObjects.splice(index, 1);
            }
        } else {
            var number = parseInt(activeObject.text.text);

            // Remove the shape object from the canvas
            canvas.remove(activeObject);

            // Handle annotations associated with the shape
            if (annotationMap[number]) {
                removeAnnotationText(number);
                deleteAnnotationText(number);
                delete annotationMap[number];
            }
            deleteAnnotationRow(number);
        }
    });

    canvas.discardActiveObject();
    canvas.renderAll();
}

// Function to remove annotation text
function removeAnnotationText(number) {
    if (annotationMap[number] && annotationMap[number].text) {
        canvas.remove(annotationMap[number].text);
    }
}
function removeAnnotationText(number) {
    if (annotationMap[number] && annotationMap[number].text) {
        canvas.remove(annotationMap[number].text);
    }
}

// Function to zoom in
function zoomIn() {
    var zoomLevel = canvas.getZoom();
    zoomLevel += 0.1;
    canvas.setZoom(zoomLevel);
}

// Function to zoom out
function zoomOut() {
    var zoomLevel = canvas.getZoom();
    zoomLevel -= 0.1;
    if (zoomLevel < 0.1) zoomLevel = 0.1;
    canvas.setZoom(zoomLevel);
}
// Function to lock/unlock a specific annotation shape
function lockShape(number, lock) {
    var shape = annotationMap[number];
    if (shape) {
        shape.selectable = !lock;
        shape.evented = !lock;
        canvas.renderAll();
    }
}

// Updated lockImages function to iterate over all annotation shapes
function lockImages(lock) {
    for (var number in annotationMap) {
        if (annotationMap.hasOwnProperty(number)) {
            lockShape(number, lock);
        }
    }
    images.forEach(img => {
        img.selectable = !lock;
        img.evented = !lock;
    });
    canvas.renderAll();
}


// Function to reset canvas event listeners based on drawing mode
function resetCanvasListeners() {
    canvas.off('mouse:down');
    canvas.off('mouse:move');
    canvas.off('mouse:up');
    if (drawingMode === 'line') {
        drawLine();
    } else if (drawingMode === 'circle') {
        drawCircle();
    } else if (drawingMode === 'arrow') {
        drawArrow();
    } else if (drawingMode === 'rectangle') {
        drawRectangle();
    } else if (drawingMode === 'customShape') {
        drawCustomShape();
    }
}

// Function to get the largest annotation number
function getLargestNumber() {
    var largest = 0;
    var table = document.getElementById('annotationTable').getElementsByTagName('tbody')[0];
    for (var i = 0, row; row = table.rows[i]; i++) {
        var value = parseInt(row.cells[0].getElementsByTagName('input')[0].value);
        if (value > largest) {
            largest = value;
        }
    }
    return largest;
}

// Function to add a new row in the annotation table
function addAnnotationRow(number) {
    var table = document.getElementById('annotationTable').getElementsByTagName('tbody')[0];
    var newRow = table.insertRow();

    var cell1 = newRow.insertCell(0);
    var cell2 = newRow.insertCell(1);
    var cell3 = newRow.insertCell(2);

    cell1.innerHTML = `<input type="number" id="annotationInput${number}" value="${number}" onchange="updateAnnotationNumber(${number}, this.value)">`;
    cell2.innerHTML = `<input type="text" id="description${number}" value="" onchange="updateAnnotationDescription(${number}, this.value)">`;
    cell3.innerHTML = `<input type="text" id="color${number}" value="" onchange="updateAnnotationColor(${number}, this.value)">`;

    sortTable(); // Sort the table after adding a new row
}

// Function to delete a row from the annotation table
function deleteAnnotationRow(number) {
    var table = document.getElementById('annotationTable').getElementsByTagName('tbody')[0];
    for (var i = 0, row; row = table.rows[i]; i++) {
        if (parseInt(row.cells[0].getElementsByTagName('input')[0].value) === number) {
            table.deleteRow(i);
            break;
        }
    }
}
// Function to update annotation number
function updateAnnotationNumber(oldNumber, newNumber) {
    canvas.discardActiveObject();
    
    // Convert newNumber to integer
    newNumber = parseInt(newNumber);

    // Check if newNumber already exists
    if (newNumber in annotationMap) {
        alert("Number already exists.");
        // Revert back to old number if new number already exists
        updateTableRowNumber(newNumber, oldNumber);
        // Sort the table again after reverting
        sortTable();
        return;
    }
    
    // Get the annotation object associated with oldNumber
    var annotation = annotationMap[oldNumber];
    
    // If annotation exists, update annotationMap and associated properties
    if (annotation) {
        annotationMap[newNumber] = annotation;
        delete annotationMap[oldNumber];
        
        // Update text on the canvas object
        var text = annotation.text;
        text.set({ text: String(newNumber) });
        canvas.renderAll();
    }
    
    // Update the table row number and sort the table
    updateTableRowNumber(oldNumber, newNumber);
    sortTable();

    // Update the onchange attribute to reflect the new number
    var inputElement = document.getElementById('annotationInput' + oldNumber);
    if (inputElement) {
        inputElement.setAttribute('onchange', `updateAnnotationNumber(${newNumber}, this.value)`);
        inputElement.id = 'annotationInput' + newNumber; // Update the ID as well
    }
}

// Function to update annotation number in table row
function updateTableRowNumber(oldNumber, newNumber) {
    var table = document.getElementById('annotationTable').getElementsByTagName('tbody')[0];
    for (var i = 0, row; row = table.rows[i]; i++) {
        if (parseInt(row.cells[0].getElementsByTagName('input')[0].value) === oldNumber) {
            row.cells[0].getElementsByTagName('input')[0].value = newNumber;
            break;
        }
    }
}

// Function to sort annotation table rows
function sortTable() {
    var table = document.getElementById('annotationTable').getElementsByTagName('tbody')[0];
    var rows = Array.from(table.rows);
    rows.sort((a, b) => parseInt(a.cells[0].getElementsByTagName('input')[0].value) - parseInt(b.cells[0].getElementsByTagName('input')[0].value));
    rows.forEach(row => table.appendChild(row));
}

// Function to add number label associated with an annotation object
function addNumberLabel(number, obj) {
    if (number === null) return;
    var text = new fabric.Text(String(number), {
        left: obj.get('left'),
        top: obj.get('top') - 10,
        fontSize: 16,
        fill: 'red',
        selectable: false,
        evented: false
    });
    obj.text = text;
    canvas.add(text);
    canvas.bringToFront(text);
}

// Event listener for updating number label positions when objects are moved, scaled, or rotated
canvas.on('object:moved', updateNumberLabelPosition);
canvas.on('object:scaling', updateNumberLabelPosition);
canvas.on('object:rotated', updateNumberLabelPosition);

// Function to update number label position based on object movement, scaling, or rotation
function updateNumberLabelPosition(e) {
    var obj = e.target;
    if (obj.text) {
        obj.text.set({
            left: obj.left,
            top: obj.top - 10
        });
        canvas.renderAll();
    }
}

// Function to remove rows without number column values and corresponding shapes with NaN labels
function removeEmptyRows() {
    var table = document.getElementById('annotationTable').getElementsByTagName('tbody')[0];
    
    for (var i = table.rows.length - 1; i >= 0; i--) {
        var inputElement = table.rows[i].cells[0].getElementsByTagName('input')[0];
        var value = parseInt(inputElement.value);
        
        if (isNaN(value)) {
            // Remove corresponding shape from canvas and its associated text label
            var shapeToRemove = annotationMap[value];
            if (shapeToRemove) {
                canvas.remove(shapeToRemove);
                delete annotationMap[value];
                deleteAnnotationText(shapeToRemove); // Delete associated text label
            }
            // Delete row from table regardless of NaN label
            table.deleteRow(i);
        }
    }
    canvas.renderAll();
}

// Function to delete annotation text label associated with a shape
function deleteAnnotationText(shape) {
    if (shape.text) {
        canvas.remove(shape.text);
    }
}

// Initialize drawing functionalities
drawLine();
drawArrow();
drawCircle();
drawRectangle();
drawCustomShape();
function updateAnnotationDescription(number, description) {
    canvas.discardActiveObject();
    // Custom logic to handle description updates
    console.log(`Annotation ${number} description updated to: ${description}`);
}

function updateAnnotationColor(number, color) {
    canvas.discardActiveObject();
    // Custom logic to handle color updates
    console.log(`Annotation ${number} color updated to: ${color}`);
}
// Initialize history array
// Stacks to store history for undo and redo
var undoStack = [];
var redoStack = [];

// Function to get the current state including annotations and table rows
function getCurrentState() {
    return {
        canvas: JSON.stringify(canvas.toJSON()),
        annotationMap: JSON.stringify(annotationMap),
        tableRows: document.getElementById('annotationTable').innerHTML
    };
}

// Function to save the current state to undo stack
function saveState() {
    undoStack.push(getCurrentState());
    redoStack = []; // Clear redo stack when a new action is performed
}

function undoDelete() {
    if (deletedObjects.length > 0) {
        var lastDeleted = deletedObjects.pop(); // Retrieve the last deleted object
        // Restore the shape object to the canvas
        canvas.add(lastDeleted.object);
        // Restore annotation data
        annotationMap[lastDeleted.number] = lastDeleted.object;
        addAnnotationRow(lastDeleted.number);
        addNumberLabel(lastDeleted.number, lastDeleted.object);
        // Re-sort the table if needed
        sortTable();

        canvas.renderAll();
    } else {
        console.log('No objects to undo.');
    }
}

// Event listener for keydown
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 'z') {
        undoDelete();
    } 
});
// Save state on every modification
canvas.on('object:added', saveState);
canvas.on('object:modified', saveState);
canvas.on('object:removed', saveState);
