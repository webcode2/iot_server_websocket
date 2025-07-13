data structure to send when prompt to verify for books returns( when returning borroewed book(s))
for returning books

{"event":"retrieveStudentBorrowedBooks",
"recipientId":["recipientId],
"method":"fingerPrint",
"accessId":4
}



data structure to send when prompt to verify to collect or borrow book new book, 

{"event":"retrieveUserAndSendToAdmin",
"recipientId":["recipientId],
"method":"fingerPrint",
"accessId":4
}


data structure to send back from esp32booard for successful fingerprint registration

{"event":"direct_message",
"message":{"action":"register_done","id":40},
"recipientId":"5d5c0192-8181-4bb8-91c3-e84242c1f64e"}




data structure to send back from esp32booard for successful RFID registration

{"event":"direct_message",
"message":{"action":"registerRFID_done","id":"RFID72622622"},
"recipientId":"5d5c0192-8181-4bb8-91c3-e84242c1f64e"}


