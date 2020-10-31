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

export {ChatLines, ChatSystem}