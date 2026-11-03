sub main()
    ' classic BrightScript entry point
    print "Hello from plain BrightScript"

    port = createObject("roMessagePort")
    screen = createObject("roSGScreen")
    screen.setMessagePort(port)
    screen.show()

    scene = screen.getSceneNode()
    scene.background = { color: "#101820" }

    while true
        msg = wait(0, port)
        if type(msg) = "roSGScreenEvent" and msg.isScreenClosed()
            exit while
        end if
    end while
end sub

function sum(a as integer, b as integer) as integer
    return a + b
end function
