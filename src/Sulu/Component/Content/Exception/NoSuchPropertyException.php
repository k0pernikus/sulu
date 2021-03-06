<?php
/*
 * This file is part of the Sulu CMS.
 *
 * (c) MASSIVE ART WebServices GmbH
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

namespace Sulu\Component\Content\Exception;

use Sulu\Component\Content\ContentTypeInterface;
use Sulu\Component\Content\PropertyInterface;
use Sulu\Component\Content\StructureInterface;

class NoSuchPropertyException extends \Exception
{
    /**
     * @var string
     */
    private $propertyName;

    function __construct($propertyName)
    {
        parent::__construct(sprintf('Property with name "%s" does not exist', $propertyName));
        $this->propertyName = $propertyName;
    }

    /**
     * @return string
     */
    public function getPropertyName()
    {
        return $this->propertyName;
    }

}
