
// Первоначальная настройка
document.getElementById('main').style.transform = 'scale(' + (document.documentElement.clientHeight - 100) / 2000 + ')';
let api_url = 'http://127.0.0.1:2281/sampGet';
 // ЗАДЕРЖКУ ОБНОВЛЕНИЯ ИНФОРМАЦИИ С API МЕНЯТЬ ЗДЕСЬ
let update_delay = 500;
 // ЗАДЕРЖКУ ОБНОВЛЕНИЯ ИНФОРМАЦИИ С API МЕНЯТЬ ЗДЕСЬ


// Перетягивание карты
dragElement(document.querySelector('#main'));
function dragElement(elmnt) {
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    elmnt.onmousedown = dragMouseDown;
    function dragMouseDown(e) {
        e = e || window.event;
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag; }
    function elementDrag(e) {
        e = e || window.event;
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px"; }
    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null; }
}


// Зум карты
function zoom(event) {
    // event.preventDefault();
    scale += event.deltaY * -0.0005;
    scale = Math.min(Math.max(.2, scale), 4);
    document.querySelector('#main').style.transform = `scale(${scale})`; }
let scale = (document.documentElement.clientHeight - 100) / 2000;
document.querySelector('body').onwheel = zoom;


// Переключатель карты
function toggleDefaultMap() {
    document.getElementById('main__map').src = './img/default_map.jpg';
    document.getElementById('_').style.backgroundColor = '#6e89a8'; }
function toggleDarkMap() {
    document.getElementById('main__map').src = './img/dark_map.jpg';
    document.getElementById('_').style.backgroundColor = '#6e89a8'; }


// Преобразование
function map(value, start1, stop1, start2, stop2) {
    return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1));
}


// Конвертирует координаты из SAMP в координаты на карте
function getLocation(x, y) {
    let x_cord = map(x, 3000, -3000, 2000, 0);
    let y_cord = map(y, 3000, -3000, 0, 2000);
    return {'x': x_cord, 'y': y_cord};
}


// Конвертирует argb в hex цвет
function argbToRGB(color) {
    return '#'+ ('000000' + (color & 0xFFFFFF).toString(16)).slice(-6);
}


// Плавное перемещение элемента
function moveElement(el, player_loc, ang) {
    element = document.querySelector(el);
    element_pos = element.getBoundingClientRect();
    $(el).animate({
        left: player_loc['x'],
        top: player_loc['y'],
        // deg: '-' + ang,
    }).delay(update_delay);
}


// Обновление
function update() {
    let data;
    $.ajax({ url: api_url, type: 'GET', dataType: 'json', async: true, success: function(res) {
            if (Object.keys(res['data']).length == 0) { return; }
            data = res['data'];

            // Обновление данных об игроке
            let player_el = document.getElementById("main__player");
            let player_loc = getLocation(data['playerData']['playerPos']['x'], data['playerData']['playerPos']['y'])
            if (player_el) {    // Если игрок существует на карте
                player_el.style.left = player_loc['x'] + 'px';
                player_el.style.top = player_loc['y'] + 'px';
                player_el.style.transform = "rotate(-" + data['playerData']['playerPos']['ang'] + "deg)";
            } else {    // Если игрок не существует на карте
                let player = $.parseHTML('' +
                    '<img id="main__player" ' +
                    'src="./img/radar_centre.png" ' +
                    'alt="Игрок" ' +
                    'style="position: absolute; ' +
                    'left: ' + player_loc['x'] + 'px; ' +
                    'top: ' + player_loc['y'] + 'px; ' +
                    'width: 20px; ' +
                    'height: 20px; ' +
                    'transform: rotate(-' + data["playerData"]["playerPos"]["ang"] + 'deg); transform-origin: 50% 50%; ' +
                    'z-index: 510;">');
                $('#main').append(player);
            }
            // Конец обновления данных об игроке



            // Обновление данные о вейпоинта на карте (Из меню паузы)
            let waypoint_el = document.getElementById("main__waypoint");
            if (waypoint_el) {  // Если вейпоинт существует на карте
                if (data['playerData']['markerPos']['isMarkerActive']) {  // Если вейпоинт активен в игре
                    // Здесь обновляем координаты вейпоинта
                    let waypoint_loc = getLocation(data['playerData']['markerPos']['x'], data['playerData']['markerPos']['y'])
                    waypoint_el.style.left = waypoint_loc['x'] + 'px';
                    waypoint_el.style.top = waypoint_loc['y'] + 'px';
                } else {    // Если вейпоинт больше не активен в игре
                    // Удаляем вейпоинт с карты
                    waypoint_el.parentNode.removeChild(waypoint_el);
                }
            } else {    // Если вейпоинт не существует на карте
                if (data['playerData']['markerPos']['isMarkerActive']) {  // Если вейпоинт активен в игре
                    // Добавляем вейпоинт на карту
                    let waypoint_loc = getLocation(data['playerData']['markerPos']['x'], data['playerData']['markerPos']['y'])
                    let waypoint = $.parseHTML('' +
                        '<img id="main__waypoint" ' +
                        'src="./img/radar_waypoint.png" ' +
                        'alt="Вейпоинт" ' +
                        'style="position: absolute; ' +
                        'left: ' + waypoint_loc['x'] + 'px; ' +
                        'top: ' + waypoint_loc['y'] + 'px; ' +
                        'width: 24px; ' +
                        'height: 24px; ' +
                        'transform-origin: 50% 50%; ' +
                        'z-index: 502;">');
                    $('#main').append(waypoint);
                }
            }
            // Конец обновления данные о вейпоинта на карте (Из меню паузы)



            // Обновление данные о GPS вейпоинте на карте (Из меню /gps)
            let gps_waypoint_el = document.getElementById("main__gps_waypoint");
            if (gps_waypoint_el) {  // Если вейпоинт существует на карте
                if (data['playerData']['gpsMarkerPos']['isMarkerActive']) {  // Если вейпоинт активен в игре
                    // Здесь обновляем координаты GPS вейпоинта
                    let gps_waypoint_loc = getLocation(data['playerData']['gpsMarkerPos']['x'], data['playerData']['gpsMarkerPos']['y'])
                    gps_waypoint_el.style.left = gps_waypoint_loc['x'] + 'px';
                    gps_waypoint_el.style.top = gps_waypoint_loc['y'] + 'px';
                } else {    // Если GPS вейпоинт больше не активен в игре
                    // Удаляем GPS вейпоинт с карты
                    gps_waypoint_el.parentNode.removeChild(gps_waypoint_el);
                }
            } else {    // Если GPS вейпоинт не существует на карте
                if (data['playerData']['gpsMarkerPos']['isMarkerActive']) {  // Если вейпоинт активен в игре
                    // Добавляем GPS вейпоинт на карту
                    let gps_waypoint_loc = getLocation(data['playerData']['gpsMarkerPos']['x'], data['playerData']['gpsMarkerPos']['y'])
                    let gps_waypoint = $.parseHTML('' +
                        '<img id="main__gps_waypoint" ' +
                        'src="./img/radar_gps_waypoint.png" ' +
                        'alt="GPS Вейпоинт" ' +
                        'style="position: absolute; ' +
                        'left: ' + gps_waypoint_loc['x'] + 'px; ' +
                        'top: ' + gps_waypoint_loc['y'] + 'px; ' +
                        'width: 24px; ' +
                        'height: 24px; ' +
                        'transform-origin: 50% 50%; ' +
                        'z-index: 501;">');
                    $('#main').append(gps_waypoint);
                }
            }
            // Конец обновления данные о GPS вейпоинта на карте (Из меню /gps)



            // Обновление данных об игроках поблизости
            if (Object.keys(data['pedsNear']).length > 0) { // Если есть данные об игроках поблизости
                document.getElementById('main__players').innerHTML = '';
                for (let value of data['pedsNear']) {
                    let near_ped_loc = getLocation(value['playerPos']['x'], value['playerPos']['y'])
                    let border = '';
                    if (value['playerVeh']['isCharInAnyCar']) {
                        border = 'border: 2px solid black;';
                    } else {
                        border = 'border: 2px solid black;';
                    }
                    let near_ped = $.parseHTML('' +
                        '<div ' +
                        'id="main__player_' + value['playerName'] + '"' +
                        'style="' +
                        'position: absolute; ' +
                        'left: ' + near_ped_loc["x"] + 'px; ' +
                        'top: ' + near_ped_loc["y"] + 'px; ' +
                        'width: 12px; ' +
                        'height: 12px; ' + border +
                        'background-color: ' + argbToRGB(value['playerColor']) + '; ' +
                        'opacity: .5; ' +
                        'z-index: 500;"></div>');
                    $('#main__players').append(near_ped);
                }
            }
            // Конец обновления данных об игроках поблизости

    }});
}

setInterval(update, update_delay);
