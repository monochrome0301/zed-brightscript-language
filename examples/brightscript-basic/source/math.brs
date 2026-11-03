rem simple helpers

function clamp(value as integer, min as integer, max as integer) as integer
    if value < min
        return min
    else if value > max
        return max
    end if
    return value
end function

sub log(message as string)
    print "[demo] " + message
end sub
