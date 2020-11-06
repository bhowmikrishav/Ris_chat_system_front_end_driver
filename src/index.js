class FileStore{
    static choose_file_n_upload(peer_ids = []){
        return new Promise((resolve, reject)=>{
            try{
                var oReq = new XMLHttpRequest();
                oReq.open("POST", "http://127.0.0.1:1445/set_file/owned_file", true);
                const file_input = document.createElement('input')
                file_input.type = 'file'
                file_input.click()
                file_input.addEventListener('change', function(){
                    const this_file = this.files
                    if(this_file.length < 1) {
                        reject(Object.assign(Error("No File Selected"), {code:3}))
                        return
                    }

                    oReq.onloadend = (ev)=>{
                        console.log(ev);
                        resolve(JSON.parse(ev.target.response))
                    }

                    oReq.ontimeout = reject

                    const reader = new FileReader();
                    reader.onload = function(evt) {
                        console.log(evt.target);
                        console.log(new Blob([evt.target.result],
                            {
                                type: this_file[0].type,
                                name: this_file[0].name
                            }
                        ));
                      //resolve() 
                        const form = new FormData()
                        form.append('user_token', FileStore.auth_cache.user_token || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InlveW8iLCJ1c2VySWQiOiI1MDdmMTkxZTgxMGMxOTcyOWRlODYwZWEiLCJpYXQiOjE2MDMzNjMzMDh9.8vK77Keb0mw8JbztljIEMb384wu7BL-T3wwU1dhggN4")
                        form.append('allow_users', peer_ids.join())
                        form.append('file', new Blob([evt.target.result],
                            {
                                type: this_file[0].type,
                                name: this_file[0].name
                            }
                        ), this_file[0].name)
                        oReq.send(form)
                    };
                    reader.readAsArrayBuffer(this.files[0]);
                })
                
            }catch(e){
                reject(e)
            }
        })
    }
    static blob_upload(blob, fname = Date().toString(), user_token){
        return new Promise((resolve, reject)=>{
            try{
                if(!(blob instanceof Blob)) throw Error("blob should be instance of Blob")
                if(typeof fname !== 'string') throw Error("fname should be type String")
                var oReq = new XMLHttpRequest();
                oReq.open("POST", "http://127.0.0.1:1445/set_file/owned_file", true);
                oReq.onloadend = (ev)=>{
                    console.log(ev);
                    resolve(JSON.parse(ev.target.response))
                }
                oReq.ontimeout = reject

                const form = new FormData()
                //remove default owner when jwt is done
                form.append('user_token', user_token || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InlveW8iLCJ1c2VySWQiOiI1MDdmMTkxZTgxMGMxOTcyOWRlODYwZWEiLCJpYXQiOjE2MDMzNjMzMDh9.8vK77Keb0mw8JbztljIEMb384wu7BL-T3wwU1dhggN4")
                form.append('file', blob, fname)
                oReq.send(form)

            }catch(e){
                reject(e)
            }
        })
    }
}
FileStore.auth_cache = {user_token:null}

class ChatLines{
    constructor(reciver_id /* mongodb_objectID */){
        this.reciver_id = reciver_id
        this.lines = []
    }
    add_line_text(text){
        const header = {type:'text'}
        const body = text.toString()
        this.lines.push({header, body})
    }
    async add_line_file_auto_user_input_sync(){
        const this_class = this
        try{
            const file = await FileStore.choose_file_n_upload([this_class.reciver_id])
            
            const header = {
                "type": "file",
                "file_token": file.file_token,
                "preview_mime_type": file.preview? file.preview.type : false,
                "meta" : file.about_file
            }
            const body = file.preview ? file.preview.dataurl : ""

            this_class.lines.push({header, body})
            
        }catch(e){
            console.log(e)
            return null
        }
    }
    frame_request(req_id){
        return Object.assign(this, {req_id})
    }
}

class ChatSystem{
    constructor(io){
        const this_class = this
        try {
            this_class.io = io
            this_class.request_index = 0
        } catch (e) {
            throw e
        }
    }
    connect_and_authorize( user_token = {_id:'123456'} ){
        const this_class = this
        return new Promise((resolve, reject)=>{
            try {
                this_class.socket = io('http://localhost:8080', {transports: ['websocket']})
                this_class.socket.on('connected', (_)=>{
                    this_class.socket.emit('verify', {user_token})
                })
                this_class.socket.on('ready', resolve)
            } catch (e) {
                reject(e)
            }
        })
    }
    send_msg(chat_lines){
        const this_class = this
        return new Promise((resolve, reject)=>{
            try{
                if(!(chat_lines instanceof ChatLines)) throw Error('chat_lines must be instance of ChatLines class')
                //adding req_id and storing reference in request (YES REF SYSTEM IS PRESEREVED)
                const request = chat_lines.frame_request(this_class.#get_new_request_index())
                //sending the message
                this_class.socket.emit('send_msg', request)
                console.log("lookin for", 'send_msg/'+request.req_id);
                //adding event listener
                this_class.socket.on('send_msg/'+request.req_id, (data)=>{
                    resolve(data)
                    //removing the event listener
                    this_class.socket.off('send_msg/'+request.req_id)
                })
            }catch(e){
                reject(e)
            }
        })
    }

    get_messages_oneway_pleanty_of_sender(sender_id){
        const this_class = this
        return new Promise((resolve, reject)=>{
            try{
                //adding req_id and storing reference in request (YES REF SYSTEM IS PRESEREVED)
                const request = {req_id:this_class.#get_new_request_index(), sender_id}
                //sending the message
                this_class.socket.emit('get_messages_oneway_pleanty_of_sender', request)
                console.log("lookin for", 'get_messages_oneway_pleanty_of_sender/'+request.req_id);
                //adding event listener
                this_class.socket.on('get_messages_oneway_pleanty_of_sender/'+request.req_id, (data)=>{
                    resolve(data)
                    //removing the event listener
                    this_class.socket.off('get_messages_oneway_pleanty_of_sender/'+request.req_id)
                })
            }catch(e){
                reject(e)
            }
        })
    }

    get_messages_bothway_pleanty_of_sender(sender_id){
        const this_class = this
        return new Promise((resolve, reject)=>{
            try{
                //adding req_id and storing reference in request (YES REF SYSTEM IS PRESEREVED)
                const request = {req_id:this_class.#get_new_request_index(), sender_id}
                //sending the message
                this_class.socket.emit('get_messages_bothway_pleanty_of_sender', request)
                console.log("lookin for", 'get_messages_bothway_pleanty_of_sender/'+request.req_id);
                //adding event listener
                this_class.socket.on('get_messages_bothway_pleanty_of_sender/'+request.req_id, (data)=>{
                    resolve(data)
                    //removing the event listener
                    this_class.socket.off('get_messages_bothway_pleanty_of_sender/'+request.req_id)
                })
            }catch(e){
                reject(e)
            }
        })
    }

    get_messages_bothway_range_id_of_sender(sender_id, id_onwards, id_untill){//untested
        const this_class = this
        return new Promise((resolve, reject)=>{
            try{
                //adding req_id and storing reference in request (YES REF SYSTEM IS PRESEREVED)
                const request = {req_id:this_class.#get_new_request_index(), sender_id, id_onwards, id_untill}
                //sending the message
                this_class.socket.emit('get_messages_bothway_range_id_of_sender', request)
                console.log("lookin for", 'get_messages_bothway_range_id_of_sender/'+request.req_id);
                //adding event listener
                this_class.socket.on('get_messages_bothway_range_id_of_sender/'+request.req_id, (data)=>{
                    resolve(data)
                    //removing the event listener
                    this_class.socket.off('get_messages_bothway_range_id_of_sender/'+request.req_id)
                })
            }catch(e){
                reject(e)
            }
        })
    }

    get_messages_oneway_post_id_of_sender(sender_id, id_onwards){//untested
        const this_class = this
        return new Promise((resolve, reject)=>{
            try{
                //adding req_id and storing reference in request (YES REF SYSTEM IS PRESEREVED)
                const request = {req_id:this_class.#get_new_request_index(), sender_id, id_onwards}
                //sending the message
                this_class.socket.emit('get_messages_oneway_post_id_of_sender', request)
                console.log("lookin for", 'get_messages_oneway_post_id_of_sender/'+request.req_id);
                //adding event listener
                this_class.socket.on('get_messages_oneway_post_id_of_sender/'+request.req_id, (data)=>{
                    resolve(data)
                    //removing the event listener
                    this_class.socket.off('get_messages_oneway_post_id_of_sender/'+request.req_id)
                })
            }catch(e){
                reject(e)
            }
        })
    }

    #get_new_request_index = ()=>{
        return this.request_index = (this.request_index+1) % 50000000
    }
}

export {ChatLines, ChatSystem, FileStore}