<?php
/*
 * This file is part of the Sulu CMS.
 *
 * (c) MASSIVE ART WebServices GmbH
 *
 * This source file is subject to the MIT license that is bundled
 * with this source code in the file LICENSE.
 */

namespace Sulu\Bundle\CategoryBundle\Category;

use Sulu\Bundle\CategoryBundle\Entity\Category;
use Sulu\Bundle\CategoryBundle\Api\Category as CategoryWrapper;

/**
 * Defines the operations of the CategoryManager.
 * The CategoryManager is responsible for the centralized management of our categories.
 * @package Sulu\Bundle\CategoryManger\Category
 */
interface CategoryManagerInterface
{
    /**
     * Returns tags with a given parent and/or a given depth-level
     * if no arguments passed returns all categories
     * @param int $parent the id of the parent to filter for
     * @param int $depth the depth-level to filter for
     * @return Category[]
     */
    public function find($parent = null, $depth = null);

    /**
     * Returns a category with a given id
     * @param int $id the id of the category
     * @return Category
     */
    public function findById($id);

    /**
     * Creates a new category or overrides an existing one
     * @param array $data The data of the category to save
     * @param int $userId The id of the user, who is doing this change
     * @return Category
     */
    public function save($data, $userId);

    /**
     * Deletes a category with a given id
     * @param int $id the id of the category to delete
     */
    public function delete($id);

    /**
     * Returns an API-Object for a given category-entity. The API-Object wraps the entity
     * and provides neat getters and setters
     * @param Category $category
     * @param string $locale
     * @return CategoryWrapper
     */
    public function getApiObject($category, $locale);

    /**
     * Same as getApiObject, but takes multiple category-entities
     * @param Category[] $categories
     * @param string $locale
     * @return CategoryWrapper[]
     */
    public function getApiObjects($categories, $locale);
} 
