<?php
namespace JsonStreamingParser;

interface Listener
{
    public function startDocument();

    public function endDocument();

    public function startObject();

    public function endObject($itemArr);

    public function startArray();

    public function endArray($itemArr);

    /**
     * @param string $key
     */
    public function key($key);

    /**
     * Value may be a string, integer, boolean, etc.
     * @param mixed $value
     */
    public function value($value);

    /**
     * @param string $whitespace
     */
    public function whitespace($whitespace);
}
