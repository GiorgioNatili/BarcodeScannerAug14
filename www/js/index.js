/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var app = {
    
    // Application Constructor

    canSend: false,
    codeAcquired: false,
    position: null,
    token: null,
    HOST: 'http://gcm.qwertystudio.it',
    initialize: function() {

        this.bindEvents();

    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        
        document.addEventListener('deviceready', this.onDeviceReady, false);

    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicity call 'app.receivedEvent(...);'
    onDeviceReady: function() {

        $('#error-acquired').hide();
        $('#sendEmail').show();
        
        app.initAuthentication(true);
        app.resetCodeFields();
              
        $('#page_0').bind('loadpanel', function(e){

            app.resetCodeFields();

        });

        $('#page_1').bind('loadpanel', function(e){

            app.acquireQRCode();

        });

        $('#page_2').bind('loadpanel', function(e){

            app.clearForm();

        });

        $('#sendEmail').bind('submit', app.onSendDataCode);

        $('#sendEmail input[type="text"]').bind('keypress', function(evt){

            if(app.validateEmail(this.value) && app.codeAcquired === true){

                app.canSend = true;

            }else{

                app.canSend = false

            }

        });

    },

    initAuthentication: function(status){

        if(status) {

            $('#authenticate').bind('submit', app.authenticate);

        }else{

            $('#authenticate').unbind('submit', app.authenticate);

        }
    },

    authenticate: function(evt){

        evt.preventDefault();

        var username = $('#username').val(),
            password = $('#password').val();

        if(username.length < 3){

            navigator.notification.alert('Please insert your username', null);
            return;

        }

        if(password.length < 3){

            navigator.notification.alert('Please insert your password', null);
            return;

        }

        $.ui.showMask('Loading...');

        var data = {
            username: username,
            password: password
        };

        $.ajax({

            type: "POST",
            url: app.HOST + "/api/login/PostDoLogin/",
            data: JSON.stringify(data),
            contentType: "application/json; charset=utf-8",
            crossDomain: true,
            dataType: "json",
            success: function (data, status, jqXHR) {

                app.token = data.StatusDescription;
                navigator.notification.alert("success, token: " + data.StatusDescription, null);

                app.start();

            },
            error: function (jqXHR, status) {
                // error handler
                console.log('jqXHR', jqXHR);
                console.log('status', status);
                $.ui.hideMask();
                $.ui.popup(jqXHR.responseText);

            }
        });

    },
    start: function(){
        
        $.ui.hideMask();
        $.ui.updateNavbarElements($('<a href="#page_0" class="icon home">Main</a><a href="#page_1" class="icon camera">Acquire</a><a href="#page_2" class="icon mail">Send</a>'));
        $.ui.loadContent("#page_0",false,false,"up");

    },
    onSendDataCode: function(evt){

        evt.preventDefault();
        
        if(app.codeAcquired === true && app.position){
            
            app.canSend = true;
            
        }else{
            
            app.canSend = false
            
        }
        
        
        if(!app.canSend){
            
            navigator.notification.alert('You can\'t send data if you don\'t acquire a code or you don\'t allowed the device to detect your position', null);
            return;
            
        }


        if(!app.canSend){

            navigator.notification.alert('You can\'t send data if you don\'t acquire a code, insert an e-mail and allow the device to detect your position', null);
            return;

        }

        $.ui.showMask('Loading...');

        var today = new Date(),
            data = {

                code: localStorage.getItem('lastCodeRead'), /* codice letto dal datamatrix */
                coords: app.position.latitude + ' . ' + app.position.longitude, /* coordinate gps */
                date: today.getDate() + '-' + (today.getMonth() + 1) + '-' + today.getFullYear() + '   ' + today.getHours() + ':' + today.getMinutes(), /* data e ora della lettura*/
                email: $('#sendEmail input[type="text"]').val()/*,  indirizzo di destinazione specificato dell'utente*/
                /* token: 'edb1e70e6799475b12970e6323172f9a'  questo mandalo sempre così */

            };

        $.ajax({
            type: "POST",
            url: app.HOST + "/api/Reading/PostSaveReading/",
            data: JSON.stringify(data),// now data come in this function
            contentType: "application/json; charset=utf-8",
            crossDomain: true,
            headers: { 'X-Auth-Token': app.token },
            dataType: "json",
            success: function (data, status, jqXHR) {

                $.ui.hideMask();
                navigator.notification.alert('Success: the code has been succesfully sent!', null);

                $.ui.loadContent("#page_0",false,false,"up");

            },
            error: function (jqXHR, status) {
                // error handler
                console.log(jqXHR);
                console.log(status);
                $.ui.hideMask();
                $.ui.popup(jqXHR.responseText);
            }
        });

    },

    validateEmail: function (email) {

        var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);

    },

    clearForm: function(){

        $('#sendEmail input[type="text"]').val('');
        app.canSend = false;

    },

    resetCodeFields: function(){

        $('#page_0 .lastCodeRead span').text(localStorage.getItem('lastCodeRead') || '');
        $('#page_2 .lastCodeRead span').text(localStorage.getItem('lastCodeRead') || '');

    },

    acquireQRCode: function(){

        var zoomFactor = '2.7';
        cordova.plugins.barcodeScanner.scan(app.onQRCodeSuccess, app.onQRCodeFailure, [zoomFactor, 'scannerOverlay']);

    },

    onQRCodeSuccess: function (result){

        $('#page_0 .lastCodeRead span').text(result.text);
        $('#page_2 .lastCodeRead span').text(result.text);

        localStorage.setItem('lastCodeRead', result.text);

        $('#error-acquired').hide();

        result.text === 'not_valid' ? app.codeAcquired = false : app.codeAcquired = true;
                      
        navigator.notification.alert('We got back a code: ' + result.text, function(){
                                                   
                                     if(result.cancelled === 1)return;
                                     
                                     
                                     var options = { enableHighAccuracy: true };
                                     navigator.geolocation.getCurrentPosition(app.onCoordinateSuccess, app.onCoordinateFailure, options);
       
                                     
                                                   
       });
                      
           
    },

    onCoordinateSuccess: function(position){

        app.position = position.coords;
                      
        $.ui.loadContent("#page_0",false,false,"up");

    },

    onCoordinateFailure: function(error){

        navigator.notification.alert('code: '    + error.code    + '\n' + 'message: ' + error.message + '\n', null);
        app.canSend = false;

    },

    onQRCodeFailure: function(error){

        $('#error-acquired').show();
        $('#sendEmail').hide();

        navigator.notification.alert('error accessing the QRCode', null);

    }
};